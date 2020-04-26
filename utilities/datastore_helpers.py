from google.cloud import datastore
from typing import List, Union, Any, Tuple

import os


class DataStoreInterface(object):
    """Simplify operations to datastore"""
    def __init__(self, project=''):
        self.ds = datastore.Client(project=os.environ.get('GOOGLE_PROJECT_ID', project))

    @staticmethod
    def results_filter(result: Any, return_keys: List[str]) -> dict:
        """Filter return_keys from result object

        Returns:
            (dict): filtered dict of result values

        """
        return {r: result[r] for r in return_keys if r in result}

    def query(self, kind: str, n_records: int=500, query_filters: List[Tuple[str]]=None, filter_keys: List[str]=None,
              cursor: Any = None):
        """Query records in a kind, with optional filters and keys

        Args:
            kind (str): datastore kind to access
            n_records (int): number of records in the query
            query_filters (List[Tuple[str]]): list of len(3) tuples of strings, indicating the key, comparison operator,
            and value... ex: [('keyname', '=', 'thekeyiwant')]
            filter_keys (List[str]): (optional) list of keys you'd like filtered before returning
            cursor (Any): cursor to continue queries between large sets of returned values

        Returns:
            (dict) keyed to the record_id and filtered via the inputs, (cursor) next page cursor

        """

        query = self.ds.query(kind=kind)

        if query_filters:

            for query_filter in query_filters:

                if len(query_filter) != 3:
                    raise Exception('query_filters must be tuples of len 3.')

                query.add_filter(query_filter[0], query_filter[1], query_filter[2])

        query_iterator = query.fetch(limit=n_records, start_cursor=cursor)
        page = next(query_iterator.pages)
        next_cursor = (
            query_iterator.next_page_token.decode('utf-8')
            if query_iterator.next_page_token else None)

        if filter_keys:

            return {q.id: self.results_filter(q, filter_keys) for q in page}, next_cursor

        else:

            return {q.id: q for q in page}, next_cursor

    def read(self, ids: List[Union[int, str]], kind: str, filter_keys: List[str]=None, sorted_list: bool=False):
        """read filtered values from a list of ids within a particular datastore kind

        Args:
            ids (list[Union[int, str]]): list of ids to be read from datastore
            kind (str): valid datastore kind name
            filter_keys (List[str]): (optional) list of keys you'd like filtered before returning
            sorted_list (bool): return as a sorted list rather than a dict

        Returns:
            (dict) keyed to record id or sorted list by input ids

        """

        keys = [self.ds.key(kind, id) for id in ids]
        results = self.ds.get_multi(keys)

        if filter_keys:

            results = {r.id: self.results_filter(r, filter_keys) for r in results}

        else:

            results = {r.id: r for r in results}

        if sorted_list:

            return [results[id] for id in ids]

        else:

            return results

    def update(self, data_list: List[dict], kind: str, exclude_from_indexes: Tuple[str]=None, ids: List[Any]=None):
        """Update datastore kind keys with values in data_list

        Args:
            data_list (List[dict]): list of records and key-value pairs to update
            kind (str): valid datastore kind name
            exclude_from_indexes (tuple[str]): list of keys to exclude from indexing
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