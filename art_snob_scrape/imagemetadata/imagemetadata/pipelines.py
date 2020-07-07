# -*- coding: utf-8 -*-

# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html
import sys
sys.path.append('../')
sys.path.append('../../')
from utilities.datastore_helpers import DataStoreInterface
from scrapy.pipelines.images import ImagesPipeline
from scrapy.exceptions import DropItem
from io import BytesIO

from PIL import Image, ImageChops


class ImagemetadataPipeline:
    def process_item(self, item, spider):
        return item


class CroppedImagePipeline(ImagesPipeline):

    @staticmethod
    def trim(im):
        bg = Image.new(im.mode, im.size, im.getpixel((0, 0)))
        diff = ImageChops.difference(im, bg)
        diff = ImageChops.add(diff, diff, 2.0, -100)
        bbox = diff.getbbox()
        if bbox:
            return im.crop(bbox)
        else:
            return im

    def convert_image(self, image, size=None):
        if image.format == 'PNG' and image.mode == 'RGBA':
            background = Image.new('RGBA', image.size, (255, 255, 255))
            background.paste(image, image)
            image = background.convert('RGB')
        elif image.mode == 'P':
            image = image.convert("RGBA")
            background = Image.new('RGBA', image.size, (255, 255, 255))
            background.paste(image, image)
            image = background.convert('RGB')
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        if size:
            image = image.copy()
            image.thumbnail(size, Image.ANTIALIAS)

        buf = BytesIO()

        # trim whitespace from image
        image = self.trim(image)

        image.save(buf, 'JPEG')
        return image, buf


class ArtworkPipeline:

    def __init__(self, project, kind):
        self.gcs_project = project
        self.kind = kind

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            project=crawler.settings.get('GCS_PROJECT'),
            kind=crawler.settings.get('DATASTORE_KIND')
        )

    def open_spider(self, spider):
        self.dsi = DataStoreInterface(self.gcs_project)

    def close_spider(self, spider):
        pass

    @staticmethod
    def flatten_path(items):

        img = items.get('images')

        if img:
            items.update({'images': img[0].get('path')})
            items.update({'checksum': img[0].get('checksum')})

        return items

    def process_item(self, item, spider):

        item = self.flatten_path(item)

        # check if this item already lives in our database
        items, page = self.dsi.query(self.kind,
                                     query_filters=[('page_url', '=', str(item['page_url']))])

        if len(items) > 0:
            raise DropItem(f"Item {item['page_url']} already in database...")

        # if not let's write it!
        self.dsi.update([item], self.kind, exclude_from_indexes=('description',))

        return item
