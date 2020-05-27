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
import tensorflow.compat.v1 as tf

# make tf2 compatible with tf1
tf.disable_eager_execution()
import tensorflow_hub as hub

sys.path.append('../../')

from primrose.base.node import AbstractNode


class TfhubEmbedder(AbstractNode):
    """Transform image bytedata into embeddings from tf hub model"""

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the TfhubEmbedder object

        Args:


        Returns:
            set of necessary keys for the TfhubEmbedder object

        """
        return {'module_url', 'key'}

    def tf_embedder(self, image_data):
        """Create a tf graph to get embeddings from a pre-trained module"""
        module = hub.Module(self.node_config['module_url'])
        image_size = hub.get_expected_image_size(module)

        def image_decoder(image):
            decoded_image = tf.image.decode_jpeg(image, channels=3)
            img_final = tf.image.resize_images(decoded_image, image_size)
            return img_final / 255.0

        formatted_images = tf.map_fn(image_decoder, image_data, back_prop=False, dtype=tf.float32)

        return module(formatted_images)

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
        embeddings_graph = self.tf_embedder(tf.convert_to_tensor(image_data))

        # after creating the graph, we can actually run the ebeddings to get usable objects
        sess = tf.Session()

        with sess.as_default():
            sess.run(tf.global_variables_initializer())
            embeddings = sess.run(embeddings_graph)

        data_object.add(self, embeddings, key='embeddings')

        terminate = False

        return data_object, terminate
