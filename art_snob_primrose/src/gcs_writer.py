import os
import logging
import dill
from google.cloud import storage

from primrose.base.writer import AbstractWriter
from primrose.data_object import DataObjectResponseType, DataObject


class GcsDillWriter(AbstractWriter):
    def __init__(self, configuration, instance_name):
        super().__init__(configuration, instance_name)
        self.object_key = self.node_config.get("object_key", "object")
        self.object_name_key = self.node_config.get("object_name_key", "object_name")
        self.mode = self.node_config.get("mode")
        self.object_name = self.node_config.get(
            "object_name",
            f"{self.object_key}_{self.configuration.config_hash}_{self.configuration.config_time}.dill",
        )
        self.prefix = self.node_config.get("prefix")
        self.storage_client = None
        self.bucket = None

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the GcsDillWriter object
            filename: name of the file
        Args:
            node_config (dict): set of parameters / attributes for the node
        Returns: set of necessary keys for the GcsDillWriter object
        Notes:
            bucket_name (str): bucket to upload dill objects
        """
        return set(["bucket_name", "gcs_project"])

    def upload_object_as_string(self, obj, obj_name):
        """Dill objects and upload as strings to the specified bucket/obj_name.
        If prefix is specified in the configuration, will upload to bucket/prefix/obj_name.
        """
        if self.prefix:
            obj_name = os.path.join(self.prefix, obj_name)
        blob = self.bucket.blob(obj_name)
        logging.info(
            "Uploading object to gs://{}".format(
                os.path.join(self.node_config["bucket_name"], obj_name)
            )
        )
        blob.upload_from_string(dill.dumps(obj))

    def run(self, data_object: DataObject):

        upstream_data = data_object.get_upstream_data(
            self.instance_name, rtype=DataObjectResponseType.INSTANCE_KEY_VALUE.value
        )

        if "gcs_project" in self.node_config:
            self.storage_client = storage.Client(
                project=self.node_config["gcs_project"]
            )
        else:
            self.storage_client = storage.Client()

        self.bucket = self.storage_client.get_bucket(self.node_config["bucket_name"])

        for instance_name, data_dict in upstream_data.items():
            if self.mode == "single_key":
                # if single, there is no object name, only the object
                # default object name to config hash and date
                obj = data_dict.get(self.object_key)
                if obj is not None:
                    self.upload_object_as_string(obj, self.object_name)
                else:
                    logging.info(
                        "{} key not found for data entry in upstream {} object, skipping upload".format(
                            self.object_key, instance_name
                        )
                    )
            else:
                for data_key, upload_dict in data_dict.items():
                    # check that the data object is a dict, if not skip upload
                    # upstream may only contain certain keys to upload, do not throw error
                    if not isinstance(upload_dict, dict):
                        logging.info(
                            "Upstream data from {}.{} not in necessary format, skipping upload".format(
                                instance_name, data_key
                            )
                        )
                        continue

                    obj = upload_dict.get(self.object_key)
                    obj_name = upload_dict.get(self.object_name_key)

                    if obj is not None and obj_name is not None:
                        self.upload_object_as_string(obj, obj_name)
                    else:
                        logging.info(
                            "{} or {} key not found for data entry in upstream {} object, skipping upload".format(
                                self.object_key, self.object_name_key, data_key
                            )
                        )

        terminate = False
        return data_object, terminate
