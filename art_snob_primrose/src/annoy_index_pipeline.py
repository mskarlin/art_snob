from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
import annoy
from src.pipeline import AutoAbstractPipeline, PipelineModeType
from primrose.base.transformer_sequence import TransformerSequence
from src.auto_node import TypeCheckBeforeNone

import uuid

from src.annoy_transformer import AnnoyTransformer


class AnnoyPipeline(AutoAbstractPipeline):

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            metric (str): (optional) metric space used in index: angular, euclidean, manhattan, hamming, or dot
            num_trees (int): (optional) number of trees used in index build, more = more accurate and slower
            n_neighbors (int): (optional) how many neighbors should be included with each entry
            vector_column_names: List of names to be extracted from the dataframe, len will be the num dimensions
            name_column (optional) : column with the names to be used for each datapoint, otherwise
                the neighbors will be returned as index numbers

        Returns:
            set of necessary keys for the AnnoyPipeline object

        """
        return {}

    def init_pipeline(self, data: np.ndarray, metric: str = 'angular', num_trees: int = 100):
        """Initialize the pipeline if no pipeline object is found in the upstream data objects

        Args:
            vector_length: length of input vectors to build into an index
            metric: (see annoy docs) metric to use in index space
            num_trees: integer number of trees to use when building index, more is slower but more accurate

        Returns:
            None, sets transformer_sequence

        """
        self.transformer_sequence = TransformerSequence(
            [AnnoyTransformer(vector_length=data.shape[1],
                              metric=metric,
                              num_trees=num_trees
                              )])

    def format_data(self, data: np.ndarray, vector_column_names: List) -> List[Tuple[str, List]]:

        vectors = [d.tolist() for d in data]

        # now zip names with the data
        return [a for a in zip(vector_column_names, vectors)]

    def fit(self, data: np.ndarray, key_list: List) -> Dict:
        """Add data into an annoy index object for rapid access

        Args:
            data : dataframe with all relevant index data and/or names
            vector_column_names: List of feature column names to include in index
            name_column: str column for the name

        Returns:
            Dict with the required gcs schema that reutrns
        """

        data = self.format_data(data, key_list)

        _ = self.execute_pipeline(data, PipelineModeType.FIT)

        # return the built index in GCS schema

        build_index = {'annoy_index':
                       {'object': self.transformer_sequence,
                        'object_name': f"annoy-index-{uuid.uuid1()}.dill"}}

        return build_index

    def transform(self, key_list: List) -> Dict:
        """Nearest neighbors for each vector using a pre-trained annoy-index

        Args:
            data: dataframe to extract names from
            name_column: column name to pull name data
            annoy_index: AnnoyIndex object to re-use if saved

        Returns:
            data_object (DataObject): instance of DataObject
        """

        neighbors = self.execute_pipeline(key_list, PipelineModeType.TRANSFORM)

        return {'neighbors': neighbors}
