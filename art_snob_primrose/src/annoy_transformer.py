import logging
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

    def fit(self, data):
        """Build index with data assuming data is zipped as [(name, vector)...]"""
        logging.info(f'{len(data)} index vectors are found, loading into index...')

        for i, d in enumerate(data):
            self.names.append(d[0])
            self.index.add_item(i, d[1])

        logging.info(f'Starting index build with {self.num_trees} trees...')

        self.index.build(n_trees=self.num_trees)

        logging.info('Index is successfully built.')

    def transform(self, data):
        """Get nn for each vector from pre-built index

        Returns:
            neighbor_data (dict): dict keyed to each name ( if specified ) with a list of the neighbors (with name if
                specified)

        """

        neighbor_data = {}

        for i in range(len(data)):

            neighbors = [self.names[n] for n in
                         self.index.get_nns_by_item(i, self.n_neighbors, include_distances=False)]

            neighbor_data[self.names[i]] = neighbors

        return neighbor_data
