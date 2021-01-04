from google.cloud import storage
import os


def download_gcs_local(bucket_name, source_blob_name, destination_file_name, project='artsnob-1'):
    """Downloads a blob from the bucket."""
    # bucket_name = "your-bucket-name"
    # source_blob_name = "storage-object-name"
    # destination_file_name = "local/path/to/file"

    if not os.path.exists(destination_file_name):

        storage_client = storage.Client(project=project)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(source_blob_name)
        blob.download_to_filename(destination_file_name)
