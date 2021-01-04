# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class ImagemetadataItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    pass


class ArtSnobItem(scrapy.Item):
    # define the fields for your item here like:
    size_price_list = scrapy.Field()
    color_list = scrapy.Field()
    image_urls = scrapy.Field()
    page_url = scrapy.Field()
    images = scrapy.Field()
    name = scrapy.Field()
    description = scrapy.Field()
    artist = scrapy.Field()
    standard_tags = scrapy.Field()
    checksum = scrapy.Field()
