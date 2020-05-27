from primrose.base.transformer import AbstractTransformer
import umap


class UmapTransformer(AbstractTransformer):

    def __init__(self, **kwargs):
        self.reducer = umap.UMAP(**kwargs)

    def fit(self, data):
        self.reducer.fit(data)

    def transform(self, data):
        return self.reducer.transform(data)
