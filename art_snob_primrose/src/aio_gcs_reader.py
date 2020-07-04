"""Module with AbstractNode implementation, able to read many files from GCS to a local machine

Author(s):
    Mike Skarlinski (michael.skarlinski@gmail.com)

"""

#todo: PR for this in primrose repo

import sys
import logging

sys.path.append('../../')

import asyncio
import backoff
import itertools
from gcloud.aio.storage import Storage
from aiohttp import ClientSession as Session
from aiohttp import ClientTimeout
from primrose.base.reader import AbstractReader


class AioGcsReader(AbstractReader):
    """Read a selection of records from one or more GCP Datastore kinds"""

    DATA_KEY = 'reader_data'

    @staticmethod
    def necessary_config(node_config):
        """Returns the necessary configuration keys for the AioGcsReader object

        Args:
            bucket (str): GCS bucket
            upstream_pull_key (str): (optional) key that the upstream data is pulled from rather than using gcs_objects
            gcs_objects (list[str]): (optional) list of objects from gcs

        Returns:
            set of necessary keys for the AioGcsReader object

        """
        return {'bucket'}

    def parse_gsc_objects(self, data_object):

        if self.node_config.get('upstream_pull_key', False):
            gso = data_object.get_filtered_upstream_data(self.instance_name, self.node_config.get('upstream_pull_key'))
            gso = gso.get(self.node_config.get('upstream_pull_key'))
        else:
            gso = self.node_config.get('gcs_objects')

        return gso

    @backoff.on_exception(
        backoff.expo,
        (asyncio.TimeoutError, ),
        max_tries=5,
        max_time=3600,
    )
    async def storage_download(self, storage, bucket, obj):
        return await storage.download(bucket, obj)

    async def download_objects(self, object_names):
        timeout = ClientTimeout(total=3600, connect=None, sock_connect=None, sock_read=None)
        async with Session(timeout=timeout) as session:
            storage = Storage(session=session)
            results = await asyncio.gather(
                *[self.storage_download(storage, self.node_config.get('bucket'), obj_name) for obj_name in object_names]
                # *[storage.download(self.node_config.get('bucket'), obj_name) for obj_name in object_names]
            )

        return results

    def run(self, data_object):
        """Read objects from GCS to local filesystem with async calls

        Args:
            data_object: DataObject instance

        Returns:
            (tuple): tuple containing:

                data_object (DataObject): instance of DataObject

                terminate (bool): terminate the DAG?

        """

        object_names = self.parse_gsc_objects(data_object)

        logging.info(f'Asyncronously gathering {len(object_names)} from GCS.')

        async_calls_per_second = int(self.node_config.get("rate_per_second", 1000))
        chunks = len(object_names) // async_calls_per_second + 1

        gcs_items = []

        for chunk in range(chunks):

            item_slice = itertools.islice(
                object_names, async_calls_per_second * chunk, async_calls_per_second * (chunk + 1),
            )

            objects = asyncio.run(self.download_objects(item_slice))

            gcs_items += objects

        logging.info(f'Objects downloaded into bytestrings.')

        data_object.add(self, gcs_items, key=AioGcsReader.DATA_KEY)

        terminate = False

        return data_object, terminate
