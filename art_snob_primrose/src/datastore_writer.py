"""write some data to datastore, formatted as a list of dicts"""
import os
import logging
import sys

sys.path.append('../../')

from utilities.datastore_helpers import DataStoreInterface
from primrose.base.writer import AbstractWriter
from primrose.data_object import DataObjectResponseType


class DatastoreWriter(AbstractWriter):
    ''' write list of dicts to datastore (syncronous for now, but async implementation coming soon...'''

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the DatastoreWriter object
            filename: name of the file
        Args:
            kind_name (str): kind to write to
            gcs_projcet (str): gcs project datastore instance lives in
            key (str): upstream key to write
            exclude_from_indexes (List[str]): (optional) list of field names to not-index

        Returns: set of necessary keys for the DatastoreWriter object

        """
        return set(["kind_name", "gcs_project", "key"])

    def run(self, data_object):
        """write data to datastore in sychronous chunks or in async bits

        Args:
            data_object (DataObject)

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """
        dsi = DataStoreInterface(project=self.node_config.get('project'))

        data_key = self.node_config['key']
        kind = self.node_config['kind_name']
        ids_to_write = None

        data_to_write = data_object.get_filtered_upstream_data(self.instance_name, data_key)

        if data_key not in data_to_write:
            raise Exception(f"Key {data_key} not found inside data_key object")
        else:
            data_to_write = data_to_write.get(data_key)

        # check if id keys are nested to use rather than auto-assigned ids
        if isinstance(data_to_write, dict):
            if 'data' in data_to_write and 'ids' in data_to_write:
                logging.info(f"Key data found in upstream node: {data_key}")
                ids_to_write = data_to_write.get('ids')
                data_to_write = data_to_write.get('data')
            else:
                raise Exception('Expected keys for data with ids are "data" and "ids".')

        elif self.node_config.get('ids_key'):
            id_data = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('ids_key'))
            if id_data:
                logging.info(f"Key data found in upstream node: {self.node_config.get('ids_key')}")
                id_data = id_data.get(self.node_config.get('ids_key'))
                ids_to_write = id_data
            else:
                logging.warning(f"No key data found in upstream node: {self.node_config.get('ids_key')}")

        logging.info(f"Writing {len(data_to_write)} records to datastore kind {kind}")

        dsi.update(data_to_write,
                   kind,
                   exclude_from_indexes=self.node_config.get('exclude_from_indexes'),
                   ids=ids_to_write)

        terminate = False

        return data_object, terminate
