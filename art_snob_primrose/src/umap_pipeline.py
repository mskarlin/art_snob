from src.pipeline import AutoAbstractPipeline, PipelineModeType
from primrose.base.transformer_sequence import TransformerSequence
import uuid
import pandas as pd

from src.umap_transformer import UmapTransformer
from sklearn.decomposition import PCA
from primrose.transformers.sklearn_preprocessing_transformer import SklearnPreprocessingTransformer

# todo: figure out the params for this...

class UmapPipeline(AutoAbstractPipeline):

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the ListFlattener object

        Args:
            umap_params (dict): umap params passed into the umap transformer


        Returns:
            set of necessary keys for the ListFlattener object

        """
        return {}#{'umap_params'}

    def init_pipeline(self, n_components: int = 100):
        """Initialize the pipeline if no pipeline object is found in the upstream data objects
        Returns:
            TransformerSequence
        """

        # return TransformerSequence([UmapTransformer(**self.node_config['umap_params'])])
        self.transformer_sequence = TransformerSequence([SklearnPreprocessingTransformer(PCA(n_components),
                                                                                         columns=None)])

    def fit(self, flat_list: pd.DataFrame):

        _ = self.execute_pipeline(flat_list, PipelineModeType.FIT)

        return {'transformer': {'object': self.transformer_sequence, 'object_name': f"umap-{uuid.uuid1()}.dill"}}

    def transform(self, flat_list: pd.DataFrame):
        """Dimensionally reduce data using pre-trained umap transfomer pipeline
        Args:
            data_object (DataObject): instance of DataObject
        Returns:
            data_object (DataObject): instance of DataObject
        """

        data = self.execute_pipeline(flat_list, PipelineModeType.TRANSFORM)

        return {'umap_data': data}
