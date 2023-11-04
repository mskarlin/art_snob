from google.cloud import datastore
from gcloud.aio.datastore import Datastore as aio_datastore
from gcloud.aio.datastore import PropertyFilter, Filter, PropertyFilterOperator, CompositeFilter, \
    CompositeFilterOperator, Query, Value
from aiohttp import ClientSession as Session
from aiohttp import ClientTimeout
import random
from typing import List, Union, Any, Tuple
import asyncio
import cachetools
from cachetools.keys import hashkey
from functools import partial
from threading import RLock

import os


def query_key(*args, query_filters=[], filter_keys=[], **kwargs):
    """custom hashkey builder for caching"""
    key = hashkey(*args, **kwargs)
    key += tuple(sorted(query_filters))
    key += tuple(sorted(filter_keys))
    return key

def read_key(*args, ids=[], filter_keys=[], **kwargs):
    """custom hashkey builder for caching"""
    key = hashkey(*args, **kwargs)
    key += tuple(sorted(ids))
    key += tuple(sorted(filter_keys))
    return key

class DataStoreInterface(object):
    """Simplify operations to datastore"""

    prop_query_translation = {'=': PropertyFilterOperator.EQUAL,
                              '>': PropertyFilterOperator.GREATER_THAN,
                              '<': PropertyFilterOperator.LESS_THAN,
                              '>=': PropertyFilterOperator.GREATER_THAN_OR_EQUAL,
                              '<=': PropertyFilterOperator.LESS_THAN_OR_EQUAL}

    def __init__(self, project='', use_cache=False):
        self.project = project
        self.ds = datastore.Client(project=os.environ.get('GOOGLE_PROJECT_ID', project))
        self.cache = cachetools.TTLCache(5000, 600) # 5000 items at 600 seconds
        self.lock = lock = RLock()

    def random_selection(self, kind: str, min: int, max: int, n_items: int = 1):
        """Pull a random index from a numeric index"""
        items = []

        for i in range(n_items):
            rand = random.randrange(min, max)

            item = self.query(kind=kind,
                              n_records=1,
                              query_filters=[('Key', '>', self.ds.key(kind, rand))],
                              key_filter=True,
                              tolist=True,
                              )[0][0]

            items.append(item)

        return items

    @staticmethod
    def results_filter(result: Any, return_keys: List[str]) -> dict:
        """Filter return_keys from result object

        Returns:
            (dict): filtered dict of result values

        """
        return {r: result[r] for r in return_keys if r in result}

    @staticmethod
    def maybetolist(kvdict, single_key=None, tolist=False):
        if tolist:
            if single_key:
                return [v[single_key] for v in kvdict.values()]
            else:
                # make sure to add the id back into it
                rlist = []
                for idx, value in kvdict.items():
                    value.update({'id': idx})
                    rlist.append(value)
                return rlist
        else:
            return kvdict

    @staticmethod
    def parse_single_datastore_properties(properties):

        parsed_property = {}

        for p, val in properties.items():
            if hasattr(val, 'items'):
                val = [v.value for v in val.items]
            parsed_property[p] = val

        return parsed_property

    def extract_entities(self, results):
        entities = []
        for query_result in results:
            entities += [self.parse_single_datastore_properties(result.entity.properties) for result in
                         query_result.entity_results]

        return entities

    def async_queries(self, kinds: List[str], query_filters: List[List[Tuple[str, str, str]]], limit=None):
        objects = asyncio.run(self.async_query_set(kinds, query_filters, limit))
        return self.extract_entities(objects)

    async def async_query_set(self, kinds, query_filters, limit):
        results = await asyncio.gather(*[self.async_query(kind, query, limit) for kind, query in zip(kinds, query_filters)])
        return results

    async def async_query(self, kind: str, query_filters: List[Tuple[str, str, str]] = None, limit=None):

        property_filters = []

        if query_filters:

            for query_filter in query_filters:

                if len(query_filter) != 3:
                    raise Exception('query_filters must be tuples of len 3.')

                property_filters.append(PropertyFilter(query_filter[0],
                                                       self.prop_query_translation[query_filter[1]],
                                                       Value(query_filter[2])))
        if len(property_filters) == 1:
            filters = Filter(property_filters[0])

        else:
            filters = CompositeFilter(CompositeFilterOperator.AND, property_filters)

        timeout = ClientTimeout(total=3600, connect=None, sock_connect=None, sock_read=None)
        query = Query(kind=kind, query_filter=filters, limit=limit)

        async with aio_datastore(project=os.environ.get('GOOGLE_PROJECT_ID', self.project)) as ads:
            async with Session(timeout=timeout) as s:
                results = await ads.runQuery(query, session=s)

        return results

    @cachetools.cachedmethod(lambda self: self.cache, lock=lambda self: self.lock, key=partial(query_key, 'query'))
    def query(self, kind: str, n_records: int = 500, query_filters: List[Tuple[str, str, str]] = None,
              filter_keys: List[str] = None, cursor: Any = None, keys_only: bool = False, tolist: bool = False,
              key_filter: bool = False, cache_break: int = 0):
        return self.query_nocache(kind=kind, n_records=n_records, query_filters=query_filters,
              filter_keys=filter_keys, cursor=cursor, keys_only=keys_only, tolist=tolist,
              key_filter=key_filter, cache_break=cache_break)

    def query_nocache(self, kind: str, n_records: int = 500, query_filters: List[Tuple[str, str, str]] = None,
              filter_keys: List[str] = None, cursor: Any = None, keys_only: bool = False, tolist: bool = False,
              key_filter: bool = False, cache_break: int = 0):
        """Query records in a kind, with optional filters and keys

        Args:
            kind (str): datastore kind to access
            n_records (int): number of records in the query
            query_filters (List[Tuple[str]]): list of len(3) tuples of strings, indicating the key, comparison operator,
            and value... ex: [('keyname', '=', 'thekeyiwant')]
            filter_keys (List[str]): (optional) list of keys you'd like filtered before returning
            cursor (Any): cursor to continue queries between large sets of returned values
            keys_only (bool): return only the keys? saving some bandwidth
            tolist (bool): transform the results into a list?
            key_filter (bool): use a keyfilter rather than a property based query filter
            cache_break (int): value used to break cache if needed (0 default for all calls)

        Returns:
            (dict) keyed to the record_id and filtered via the inputs, (cursor) next page cursor

        """
        query = self.ds.query(kind=kind)

        if query_filters:

            for query_filter in query_filters:

                if len(query_filter) != 3:
                    raise Exception('query_filters must be tuples of len 3.')

                if key_filter and query_filter[0] == "Key":
                    query.key_filter(query_filter[2], query_filter[1])
                else:
                    query.add_filter(query_filter[0], query_filter[1], query_filter[2])

        # can't do a projection if you're using a property filter
        if filter_keys and not query_filters:
            query.projection = filter_keys

        if keys_only:
            query.keys_only()

        query_iterator = query.fetch(limit=n_records, start_cursor=cursor)
        page = next(query_iterator.pages)
        next_cursor = (
            query_iterator.next_page_token.decode('utf-8')
            if query_iterator.next_page_token else None)

        if filter_keys:

            # if there's a single filter key, let's return that as a list
            single_key = filter_keys[0] if len(filter_keys) == 1 else None
            return self.maybetolist({q.key.id_or_name: self.results_filter(q, filter_keys) for q in page},
                                    single_key, tolist), next_cursor

        else:

            return self.maybetolist({q.key.id_or_name: q for q in page}, None, tolist), next_cursor

    def read_nocache(self, ids: List[Union[int, str]], kind: str, filter_keys: List[str] = None, sorted_list: bool = False):
        """read filtered values from a list of ids within a particular datastore kind

        Args:
            ids (list[Union[int, str]]): list of ids to be read from datastore
            kind (str): valid datastore kind name
            filter_keys (List[str]): (optional) list of keys you'd like filtered before returning
            sorted_list (bool): return as a sorted list rather than a dict
            cache_break (int): value used to break cache if needed (0 default for all calls)

        Returns:
            (dict) keyed to record id or sorted list by input ids

        """
        keys = [self.ds.key(kind, idx) for idx in ids]
        results = self.ds.get_multi(keys)

        if results: 

            if filter_keys:

                results = {r.key.id_or_name: self.results_filter(r, filter_keys) for r in results}

            else:

                results = {r.key.id_or_name: r for r in results}

            if sorted_list:
                return [results[idx] for idx in ids if idx in results]

            else:

                return results
        else:
            if sorted_list:

                return []

            else:
                
                return dict()

    @cachetools.cachedmethod(lambda self: self.cache, lock=lambda self: self.lock, key=partial(read_key, 'read'))
    def read(self, ids: List[Union[int, str]], kind: str, filter_keys: List[str] = None, sorted_list: bool = False, cache_break: int = 0):
        """read filtered values from a list of ids within a particular datastore kind

        Args:
            ids (list[Union[int, str]]): list of ids to be read from datastore
            kind (str): valid datastore kind name
            filter_keys (List[str]): (optional) list of keys you'd like filtered before returning
            sorted_list (bool): return as a sorted list rather than a dict
            cache_break (int): value used to break cache if needed (0 default for all calls)

        Returns:
            (dict) keyed to record id or sorted list by input ids

        """
        return self.read_nocache(ids=ids, kind=kind, filter_keys=filter_keys, sorted_list=sorted_list)

    def update(self, data_list: List[dict], kind: str, exclude_from_indexes: Tuple[str] = (), ids: List[Any] = None):
        """Update datastore kind keys with values in data_list

        Args:
            data_list (List[dict]): list of records and key-value pairs to update
            kind (str): valid datastore kind name
            exclude_from_indexes (tuple[str]): tuple of keys to exclude from indexing
            ids (List[Any]): list of ids that will be written, if None then default to Nones

        Returns:
            None, side effect is that the data is updated in datastore

        """

        if data_list:

            split_list = [data_list[i * 500:(i + 1) * 500] for i in range(int(len(data_list) / 500) + 1)]

            if ids:
                id_list = [ids[i * 500:(i + 1) * 500] for i in range(int(len(ids) / 500) + 1)]

            for v, chunk in enumerate(split_list):

                if ids:
                    key = [self.ds.key(kind, i) for i in id_list[v]]
                else:
                    key = self.ds.key(kind)

                try:
                    entities = [datastore.Entity(key=key[i], exclude_from_indexes=exclude_from_indexes) for i in
                                range(len(chunk))]
                except TypeError:
                    entities = [datastore.Entity(key=key, exclude_from_indexes=exclude_from_indexes) for i in
                                range(len(chunk))]

                for d, entity in enumerate(entities):
                    entity.update(chunk[d])

                self.ds.put_multi(entities)

    def delete(self, id: Any, kind: str):
        """Delete a single id from datastore

        Args:
            id (Any): id to delete
            kind (str): kind datstore name

        """
        key = self.ds.key(kind, id)
        self.ds.delete(key)

    def delete_table(self, kind: str):
        """Iterate over all keys to delete a table

        Args:
            kind (str): datastore kind to remove

        """
        query = self.ds.query(kind=kind)
        items = [item for item in query.fetch()]
        keys = [self.ds.key(kind, entity.id) for entity in items]
        split_list = [keys[i * 500:(i + 1) * 500] for i in range(int(len(keys) / 500) + 1)]

        for sl in split_list:
            self.ds.delete_multi(sl)
