"""Take N random selections of inputs

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

# todo: PR for this in primrose repo

import sys
import logging
import random
from typing import Dict

sys.path.append('../')
sys.path.append('../../')

from src.auto_node import AutoNode


class RandomSelections(AutoNode):
    """Read a selection of records from one or more GCP Datastore kinds"""

    DATA_KEY = 'reader_data'

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the RandomSelections object


        Returns:
            set of necessary keys for the RandomSelections object

        """
        return {}

    def execute(self, datastore_keys: Dict, N: int=100, n_cutoff: int=100) -> Dict:
        """Read datastore object(s) from remote datastore queries

        Args:
            datastore_keys (Dict): all ds keys as dict keys keyed to entities
            N: how many random subsets you like
            n_cutoff: how many within each subset you like to keep

        Returns:
            (Dict): shuffled data with selection keys (used to select the lists down from DS)
        
        """

        logging.info(f'Shuffling for {N} iterations with key list of length: {len(datastore_keys)}')

        keys_to_shuffle = list(datastore_keys)

        random_keys_to_write = []
        selection_keys = []

        for i in range(1, N+1):
            selection_keys.append(i)
            random_keys_to_write.append({'random_keys': random.sample(keys_to_shuffle, n_cutoff)})

        logging.info('Random selections complete!')

        return {'random_data': random_keys_to_write, 'datastore_keys': selection_keys}
