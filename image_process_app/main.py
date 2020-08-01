# for when running locally
import sys
import os
import logging

sys.path.insert(0, '../art_snob_primrose')
import dill
from google.cloud import storage
from src.annoy_transformer import AnnoyTransformer
from src.tfhub_embedder import TfhubEmbedder
from fastapi import FastAPI, File, UploadFile

# grab the initial files
# logging.basicConfig(level=logging.INFO)

PCA_REDUCTION_GCSLOC = os.environ.get('PCA_REDUCTION_GCSLOC',
                                      'umap-e5c93054-d366-11ea-8037-42010a8e002a.dill')

ANNOY_INDEX_GCSLOC = os.environ.get('ANNOY_INDEX_LOC',
                                    'annoy/07312020/small_index.ann')

ANNOY_TRANSFORMER_GCSLOC = os.environ.get('ANNOY_INDEX_LOC',
                                          'annoy/07312020/transform-maps-e2b99516-d375-11ea-a1f7-42010a8e002b.dill')

VECTOR_LENGTH = os.environ.get('VECTOR_LENGTH', 100)  # this is only needed while this doesn't exist in object
METRIC = os.environ.get('METRIC', 'angular')  # this is only needed while this doesn't exist in object

GCS_BUCKET = os.environ.get('GCS_BUCKET', 'artsnob-models')

TFHUBMODEL = os.environ.get('TFHUBMODEL', 'https://tfhub.dev/google/imagenet/inception_resnet_v2/feature_vector/1')


def gcs_reader(bucket, object, write_location=None):
    # Read the data from Google Cloud Storage
    read_storage_client = storage.Client()

    # get bucket with name
    bucket = read_storage_client.get_bucket(bucket)
    # get bucket data as blob
    blob = bucket.get_blob(object)
    # download as string

    if write_location:
        with open(write_location, 'wb') as f:
            f.write(blob.download_as_string())

    else:
        return blob.download_as_string()


def dill_object_from_gcs_transformer(location):
    """de-serialize and pull the first transformer sequence out of a primrose transformer sequence"""
    return dill.loads(gcs_reader(object=location,
                                 bucket=GCS_BUCKET)).sequence[0]


pca_transformer = dill_object_from_gcs_transformer(PCA_REDUCTION_GCSLOC)

previous_annoy_transformer = dill_object_from_gcs_transformer(ANNOY_TRANSFORMER_GCSLOC)

# _ = gcs_reader(object=ANNOY_INDEX_GCSLOC,
#                bucket=GCS_BUCKET,
#                write_location='ann.index')

annoy_transformer = AnnoyTransformer(vector_length=VECTOR_LENGTH,
                                     metric=METRIC,
                                     num_trees=previous_annoy_transformer.num_trees,
                                     n_neighbors=previous_annoy_transformer.n_neighbors,
                                     )

annoy_transformer.names = previous_annoy_transformer.names,
annoy_transformer.name_to_index = previous_annoy_transformer.name_to_index,
annoy_transformer.index.load('ann.index')

tfe = TfhubEmbedder()
tfe.tf_hub_model_init(TFHUBMODEL)

app = FastAPI()

@app.post("/similar_images/")
def similar_images(file: UploadFile = File(...), n_images: int = 10):

    contents = file.file.read()

    embeddings = tfe.tf_embedder([contents])

    pca_embeddings = pca_transformer.transform([embeddings])



    neighbors = annoy_transformer.index.get_nns_by_vector(pca_embeddings[0], n_images, include_distances=False)

    # import ipdb; ipdb.set_trace()

    return {"neighbors": [annoy_transformer.names[0][n] for n in neighbors]}
