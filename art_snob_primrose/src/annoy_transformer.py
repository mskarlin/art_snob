import logging
from typing import List
from primrose.base.transformer import AbstractTransformer
from annoy import AnnoyIndex


class AnnoyTransformer(AbstractTransformer):

    def __init__(self, vector_length, metric='angular', num_trees=100, n_neighbors=100):
        """Build annoy index, with a fixed vector length, distance metric and n_trees

        """
        self.index = AnnoyIndex(vector_length, metric=metric)
        self.num_trees = num_trees
        self.n_neighbors = n_neighbors
        self.names = []
        self.name_to_index = {}

    def fit(self, data: List):
        """Build index with data assuming data is zipped as [(name, vector)...]"""

        logging.info(f'{len(data)} index vectors are found, loading into index...')

        for i, d in enumerate(data):
            self.names.append(d[0])
            self.name_to_index[d[0]] = i
            self.index.add_item(i, d[1])

        logging.info(f'Starting index build with {self.num_trees} trees...')

        self.index.build(n_trees=self.num_trees)

        logging.info('Index is successfully built.')

    def transform(self, names: List):
        """Get nn for each vector from pre-built index using the input names

        Returns:
            neighbor_data (dict): dict keyed to each name ( if specified ) with a list of the neighbors (with name if
                specified)

        """

        neighbor_data = []

        for n in names:

            if n in self.name_to_index:

                i = self.name_to_index[n]

                neighbors = [self.names[neighbor] for neighbor in
                             self.index.get_nns_by_item(i, self.n_neighbors, include_distances=False)]

                neighbor_data.append(neighbors)

        return neighbor_data
