"""Module with AbstractNode implementation, able to read from GCP datastore

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

#todo: PR for this in primrose repo

import sys
import logging
import warnings

sys.path.append('../')
sys.path.append('../../')

from utilities.datastore_helpers import DataStoreInterface
from primrose.base.reader import AbstractReader


class DataStoreReader(AbstractReader):
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

        Returns:
            set of necessary keys for the DataStoreReader object

        """
        return {'project', 'kind'}

    def run(self, data_object):
        """Read datastore object(s) from remote datastore queries

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        dsi = DataStoreInterface(project=self.node_config.get('project'))

        cursor = None
        all_records = {}

        logging.info(f'Starting datastore read from kind: {self.node_config.get("kind")}')

        while True:

            records, cursor = dsi.query(kind=self.node_config.get('kind'),
                                        n_records=self.node_config.get('n_records_per_query', 500),
                                        query_filters=self.node_config.get('query_filters'),
                                        filter_keys=self.node_config.get('filter_keys'),
                                        cursor=cursor
                                        )

            all_records.update(records)

            if self.node_config.get('max_records'):
                if len(all_records) >= self.node_config.get('max_records') or cursor is None:
                    logging.info(f'Stopping query at {len(all_records)} records')
                    break
            elif cursor is None:
                break

        logging.info(f'Read down {len(all_records)} records from kind: {self.node_config.get("kind")}')

        data_object.add(self, all_records, key=DataStoreReader.DATA_KEY)

        terminate = False

        return data_object, terminate
