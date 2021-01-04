import sys
from typing import Dict, Any
import logging
import warnings
import uuid
import shutil

sys.path.append('../../')

from src.auto_node import AutoNode
import glob
import os
from google.cloud import storage


def upload_local_directory_to_gcs(local_path, bucket, gcs_path):
    for local_file in glob.glob(local_path + '/**'):
        if not os.path.isfile(local_file):
            upload_local_directory_to_gcs(local_file, bucket, gcs_path + "/" + os.path.basename(local_file))
        else:
            remote_path = os.path.join(local_file[2:])  # get rid of ./
            storage_client = storage.Client()
            bucket = storage_client.get_bucket(bucket)
            blob = bucket.blob(remote_path)
            blob.upload_from_filename(local_file)


class AnnoyUploader(AutoNode):
    """Take a dict and extract out keys into a list"""

    @staticmethod
    def necessary_config(node_config):
        return {'gcs_location'}

    def execute(self, annoy_index: Any, gcs_location: str) -> Dict:

        base_name = gcs_location.split('gs://')[-1]
        bucket = base_name.split('/')[0]
        base_name = '.'+base_name[len(bucket):]
        filename = base_name.split('/')[-1]
        mapping_name = base_name[:-len(filename)]

        if not os.path.exists(mapping_name):
            os.makedirs(mapping_name)

        annoy_index.sequence[0].index.save(base_name)
        annoy_index.sequence[0].index = None

        upload_local_directory_to_gcs(mapping_name, bucket, gcs_location)

        return {'clear_index': {'object': annoy_index, 'object_name':
            f"{mapping_name[2:]}transform-maps-{uuid.uuid1()}.dill"}}
