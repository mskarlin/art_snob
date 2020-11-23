"""Module with AbstractNode implementation, able to transform mutliple lists into a data store entity

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

import sys
import numpy as np
import logging
import warnings

from primrose.base.node import AbstractNode
from src.auto_node import AutoNode
from typing import Dict


class EntityFormatter(AbstractNode):
    """Create a dict for each entity, optionally with a list of ids"""

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            property_keys (List[str]): list of the upstream keys to break into properties
            id_keys (List[str]):(optional) list of id keys which will concat into a single string for each record

        Returns:
            set of necessary keys for the EntityFormatter object

        """
        return {'property_keys'}

    def run(self, data_object):
        """Transform dict into list of keys, also store the keys in a separate object for future use

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        if self.node_config.get('id_keys'):

            id_iters = [data_object.get_filtered_upstream_data(self.instance_name, id_key).get(id_key) for id_key in
                            self.node_config.get('id_keys')]
            id_data = ['|'.join(x) for x in zip(id_iters)]

            data_object.add(self, id_data, key='id_list')

        combined_objects = []

        for key in self.node_config['property_keys']:

            candidate = data_object.get_filtered_upstream_data(self.instance_name, key)

            if candidate.get(key) is not None:

                for i, item in enumerate(candidate.get(key)):

                    if isinstance(item, np.ndarray):
                        item = item.tolist()

                    if len(combined_objects) <= i:
                        combined_objects.append({key: item})
                    else:
                        combined_objects[i].update({key: item})

        data_object.add(self, combined_objects, key='entities')

        terminate = False

        return data_object, terminate


class ReverseIndex(AutoNode):
    """Make a dict into a list of keys for each field within a dict"""
     
    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ReverseIndex object
        """
        return {'index_key'}
    
    def execute(self, data: Dict, index_key: str, convert_to_list_of_dict: bool = True):

        inverse_index = {}
        index_keys = []

        for k,v in data.items():
            newkey = v.get(index_key) # return a list for each object (list of words, tags, etc.)
            for key in newkey:
                if key:
                    if key in inverse_index:
                        inverse_index[key].append(k)
                    else:
                        inverse_index[key] = [k]
            
        if convert_to_list_of_dict:
            list_index = []
            for k, v in inverse_index.items():
                index_keys.append(k)
                list_index.append({'keys': v})
            inverse_index = list_index

        return {'inverse_index': inverse_index, 'index_keys': index_keys}