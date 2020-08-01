"""Module with AbstractNode implementation, able to embded images from tfhub

NOTES:
    works with tf < 2.0 API only
    This could be a transformer, but since serialization is already covered via the tf-hub API we don't
    need to write this object to memory. For now we can leave it as it's own node.

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

#todo: PR for this in primrose repo

import sys
import logging
import warnings
import numpy as np
import tensorflow as tf

import tensorflow_hub as hub

sys.path.append('../../')

from src.auto_node import AutoNode


class TfhubEmbedder(AutoNode):
    """Transform image bytedata into embeddings from tf hub model"""

    def __init__(self, configuration=None, instance_name=None):

        if configuration is not None and instance_name is not None:
            super(TfhubEmbedder, self).__init__(configuration, instance_name)
        self.m = None
        self.height = None
        self.width = None

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the TfhubEmbedder object

        Args:


        Returns:
            set of necessary keys for the TfhubEmbedder object

        """
        return {'module_url', 'key'}

    def tf_hub_model_init(self, hub_url):
        self.m = hub.KerasLayer(hub_url)
        module_spec = hub.load_module_spec(hub_url)
        self.height, self.width = hub.get_expected_image_size(module_spec)

    def tf_embedder(self, image_data, batch_size=1000):
        """Create a tf graph to get embeddings from a pre-trained module"""

        if self.m is None:
            raise Exception('Must initialize model with tf_hub_model_init method...')

        def image_decoder(image):
            decoded_image = tf.image.decode_jpeg(image, channels=3)
            img_final = tf.image.resize(decoded_image, [self.height, self.width])
            return img_final / 255.0

        dataset = tf.data.Dataset.from_tensor_slices(image_data)

        mdataset = dataset.map(image_decoder).batch(batch_size)

        final_output = []

        for i, bdata in enumerate(mdataset):
            logging.info(f'Process batch {i} with size: {bdata.shape}')
            final_output.append(self.m(bdata))

        return tf.concat(final_output, 0).numpy().squeeze()

    def run(self, data_object):
        """Embeddings for each image in the data_object

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        image_data = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('key'))
        image_data = image_data.get(self.node_config.get('key'))

        self.tf_hub_model_init(hub_url=self.node_config['module_url'])

        embeddings = self.tf_embedder(image_data, self.node_config.get('batch_size', 1000))

        data_object.add(self, embeddings, key='embeddings')

        terminate = False

        return data_object, terminate
