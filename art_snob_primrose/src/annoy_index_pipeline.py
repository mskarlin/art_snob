from primrose.base.pipeline import AbstractPipeline, PipelineModeType
from primrose.base.transformer_sequence import TransformerSequence
import uuid

from src.annoy_transformer import AnnoyTransformer


class AnnoyPipeline(AbstractPipeline):

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            vector_length (int): size of vectors being indexed
            metric (str): (optional) metric space used in index: angular, euclidean, manhattan, hamming, or dot
            num_trees (int): (optional) number of trees used in index build, more = more accurate and slower
            name_list_key (List[str]): (optional) upstream keys used to construct the unique names
                the list of structures must be the same lenghth, then they will be zipped and concatenated to make
                the new names to be indexed
            n_neighbors (int): (optional) how many neighbors should be included with each entry


        Returns:
            set of necessary keys for the ListFlattener object

        """
        return {'vector_length'}

    def init_pipeline(self):
        """Initialize the pipeline if no pipeline object is found in the upstream data objects
        Returns:
            TransformerSequence
        """
        return TransformerSequence([AnnoyTransformer(vector_length=self.node_config['vector_length'],
                                                     metric=self.node_config.get('metric', 'angular'),
                                                     num_trees=self.node_config.get('num_trees', 100)
                                                     )])

    def get_data(self, data_object):
        # todo: these keys are too hard-coded, works for this example, but needs to be made more flexible
        data = data_object.get_filtered_upstream_data(self.instance_name,
                                                      self.node_config.get('data_key', 'umap_data'))
        vectors = data.get('umap_data')

        names = []

        for name in self.node_config.get('name_list_key', ['name_data']):
            names.append([str(d) for d in data_object.get_filtered_upstream_data(self.instance_name, name).get(name)])

        if names:
            names = ['|'.join(nz) for nz in zip(*names)]

        # now zip names with the data
        return [a for a in zip(names, vectors)]

    def fit_transform(self, data_object):
        """Nearest neighbors for each vector using an annoy index
        Args:
            data_object (DataObject): instance of DataObject
        Returns:
            data_object (DataObject): instance of DataObject
        """

        data = self.get_data(data_object)

        data = self.execute_pipeline(data, PipelineModeType.FIT_TRANSFORM)

        # break out back into list
        data = [d for d in data.values()]

        data_object.add(self, data, key='index_data', overwrite=False)
        data_object.add(self, {'object': self.transformer_sequence,
                         'object_name': f"annoy-index-{uuid.uuid1()}.dill"},
                        key='transfomer',
                        overwrite=False)

        return data_object

    def transform(self, data_object):
        """Nearest neighbors for each vector using a pre-trained annoy-index
        Args:
            data_object (DataObject): instance of DataObject
        Returns:
            data_object (DataObject): instance of DataObject
        """

        data = self.get_data(data_object)

        data = self.execute_pipeline(data, PipelineModeType.TRANSFORM)

        # break out back into list
        data = [d for d in data.values()]

        data_object.add(self, data, key='index_data', overwrite=False)

        return data_object
