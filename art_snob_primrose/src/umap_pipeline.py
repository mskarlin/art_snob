from primrose.base.pipeline import AbstractPipeline, PipelineModeType
from primrose.base.transformer_sequence import TransformerSequence
import uuid

from src.umap_transformer import UmapTransformer
from sklearn.decomposition import PCA
from primrose.transformers.sklearn_preprocessing_transformer import SklearnPreprocessingTransformer

# todo: figure out the params for this...

class UmapPipeline(AbstractPipeline):

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            umap_params (dict): umap params passed into the umap transformer


        Returns:
            set of necessary keys for the ListFlattener object

        """
        return {}#{'umap_params'}

    def init_pipeline(self):
        """Initialize the pipeline if no pipeline object is found in the upstream data objects
        Returns:
            TransformerSequence
        """

        # return TransformerSequence([UmapTransformer(**self.node_config['umap_params'])])
        return TransformerSequence([SklearnPreprocessingTransformer(PCA(self.node_config.get('n_components', 100)), columns=None)])

    def fit_transform(self, data_object):
        """Dimensional reduction of data and training of Umap
        Args:
            data_object (DataObject): instance of DataObject
        Returns:
            data_object (DataObject): instance of DataObject
        """

        data = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('data_key', 'embeddings'))

        data = data.get('embeddings')

        data = self.execute_pipeline(data, PipelineModeType.FIT_TRANSFORM)

        data_object.add(self, data, key='umap_data', overwrite=False)
        data_object.add(self, {'object': self.transformer_sequence,
                         'object_name': f"umap-{uuid.uuid1()}.dill"},
                        key='transfomer',
                        overwrite=False)

        return data_object

    def transform(self, data_object):
        """Dimensionally reduce data using pre-trained umap transfomer pipeline
        Args:
            data_object (DataObject): instance of DataObject
        Returns:
            data_object (DataObject): instance of DataObject
        """

        data = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('data_key', 'embeddings'))

        data = data.get('embeddings')

        data = self.execute_pipeline(data, PipelineModeType.TRANSFORM)

        data_object.add(self, data, key='umap_data', overwrite=False)

        return data_object
