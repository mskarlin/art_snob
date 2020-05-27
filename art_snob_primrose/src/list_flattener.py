"""Module with AbstractNode implementation, able to flatten dict structures into lists

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

#todo: PR for this in primrose repo

import sys
import logging
import warnings

sys.path.append('../../')

from primrose.base.node import AbstractNode


class ListFlattener(AbstractNode):
    """Take a dict and extract out keys into a list"""

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            key (str): key to read from upstream
            key_to_flatten (str): key to extract from the dict
            key_to_write (str): (optional) key that will be written back to the data_object defaults to flat_list

        Returns:
            set of necessary keys for the ListFlattener object

        """
        return {'key', 'key_to_flatten', 'key_to_write'}

    def run(self, data_object):
        """Transform dict into list of keys, also store the keys in a separate object for future use

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        to_flatten = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('key'))
        to_flatten = to_flatten.get(self.node_config.get('key'))

        flattened_list = [to_flatten.get(tf).get(self.node_config['key_to_flatten']) for tf in to_flatten]
        key_list = [tf for tf in to_flatten]

        data_object.add(self, flattened_list, key=self.node_config.get('key_to_write', 'flat_list'))
        data_object.add(self, key_list, key='key_list')

        terminate = False

        return data_object, terminate
