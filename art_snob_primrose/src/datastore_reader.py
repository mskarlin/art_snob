"""Module with AbstractNode implementation, able to read from GCP datastore

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

# todo: PR for this in primrose repo

import sys
import logging
import warnings
from typing import Dict, List

sys.path.append('../')
sys.path.append('../../')

from utilities.datastore_helpers import DataStoreInterface
from src.auto_node import AutoNode


class DataStoreReader(AutoNode):
    """Read a selection of records from one or more GCP Datastore kinds"""

    DATA_KEY = 'reader_data'

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the DataStoreReader object

        Args:
            project (str): GCP project id
            kind (str): datastore kind entity name
            n_records_per_query (int): (optional) number of records
            query_filters (List[(str, str, str)...]): (optional) query filters by entity attribute, ex.:
                    [['trait', '=', 'true']]
            filter_keys (List[str]): list of top-level keys to keep
            max_records (int): (optional) for testing limit the max records returned
            keys_only (bool): return just the key values or not

        Returns:
            set of necessary keys for the DataStoreReader object

        """
        return {'project', 'kind'}

    def execute(self, project: str, kind: str, n_records_per_query: int = 500,
                query_filters: List = None, filter_keys: List = None, max_records: int = None,
                keys_only: bool = False) -> Dict:
        """Read datastore object(s) from remote datastore queries

        Args:
            project: GCS project name
            kind: datastore entity kind
            n_records_per_query: number of records to be pulled per batch
            query_filters: list of Tuples of strings for filtering ( see DataStoreInterface for syntax)
            filter_keys: list of keys to be filtered for
            max_records: limit on the total records returned
            keys_only: bool

        Returns:
            (Dict): entity data keyed to the entity key

        """

        dsi = DataStoreInterface(project=project)

        cursor = None
        all_records = {}

        logging.info(f'Starting datastore read from kind: {kind}')

        while True:

            records, cursor = dsi.query(kind=kind,
                                        n_records=n_records_per_query,
                                        query_filters=query_filters,
                                        filter_keys=filter_keys,
                                        cursor=cursor,
                                        keys_only=keys_only
                                        )

            all_records.update(records)

            if max_records:
                if len(all_records) >= max_records or cursor is None:
                    logging.info(f'Stopping query at {len(all_records)} records')
                    break
            elif cursor is None:
                break

        logging.info(f'Read down {len(all_records)} records from kind: {kind}')

        return {DataStoreReader.DATA_KEY: all_records}
