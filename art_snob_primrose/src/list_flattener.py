"""Module with AbstractNode implementation, able to flatten dict structures into lists

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

#todo: PR for this in primrose repo

import sys
from typing import Dict
import logging
import warnings

sys.path.append('../../')

# from primrose.base.node import AbstractNode
from src.auto_node import AutoNode


class ListFlattener(AutoNode):
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
        return {'key_to_flatten'}

    def execute(self, dict_to_flatten: Dict, key_to_flatten: str)->Dict:
        """Transform dict into list of keys, also store the keys in a separate object for future use

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        flattened_list = [dict_to_flatten.get(tf).get(key_to_flatten) for tf in dict_to_flatten]
        key_list = [tf for tf in dict_to_flatten]

        return {'flat_list': flattened_list,
                'key_list': key_list}
