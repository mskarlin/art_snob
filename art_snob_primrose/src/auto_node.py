from primrose.base.node import AbstractNode

import inspect
from typing import List, Dict
import pandas as pd

"""
Goal is to interpret the right fields to enter in each method, as well as the right configurations 
for input into each method. Necessary config will be auto-populated using the non-default inputs that
are missing inputs from upstream

inference can be done by name and data-type the data that's passed along in the data object
will be assumed to be requirements first

to check for the necessary config-- we can simply check the config object against the inputs needed
to run across all methods, for those without defaults


"""

class AutoNode(AbstractNode):

    @staticmethod
    def necessary_config(node_config):
        # we can call the stuff we need in the run entrypoint, looking for any non-defaulted parameters


        return {'umap_params'}

    def run(self, data_object):
        # if type annotations and sub-method don't exist the user can simply specify this run function themselves

        upstream_data = data_object.get_upstream_data(self.instance_name)
        # when a collision of key names and types happens we can either: pick the first, combine into list/dict,
        # or concat if possible. We could just try each of these operations ( probably pick the first being last )
        # until the function is OK with proceeding, we can make a stack of the values to fill and pop them off
        # as we find the matches

        # get the signature of the run function
        sig = inspect.signature(AutoNode.runner_test)

        # look towards the upstream data and node config to match each object, fill with the config values first
        for param in sig.parameters:

            if param == 'self':
                continue

            elif


        return data_object, False

    # now this function can be used anywhere...
    def runner_test(self, a: pd.DataFrame, b: List[str]=['a'], c: int=4) -> Dict[str, pd.DataFrame]:
        return {'test': pd.DataFrame()}
