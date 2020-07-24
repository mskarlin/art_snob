"""
Simple script to generate a txt version of the sitemap, simply enter the output file and append any new static data
"""

import os
from google.cloud import datastore
from feed import valid_artwork

# script global variables
IMAGE_BUCKET_PREFIX = 'https://storage.googleapis.com/artsnob_images/'
HOST_PREFIX = 'https://www.artsnob.io'
STATIC_LINKS = ['', '/profile', '/tos']
DYNAMIC_LINK_HEADERS = ['/detail', '/blog']
SITEMAP_FILENAME = 'sitemap.txt'


# pull down dynamic valid artwork links and blog links
datastore_client = datastore.Client()
dynamic_links_content = {'/detail': [va[5:-4] for va in valid_artwork(datastore_client)]}

all_posts = datastore_client.query(kind='blog_post')
dynamic_links_content.update({'/blog': [li['entry_id'] for li in all_posts.fetch()]})

# create the sitemap
with open(SITEMAP_FILENAME, 'w') as f:

    for sl in STATIC_LINKS:
        f.write('{}{}\n'.format(HOST_PREFIX, sl))

    for dl in DYNAMIC_LINK_HEADERS:
        for content in dynamic_links_content[dl]:
            f.write('{}{}{}\n'.format(HOST_PREFIX, dl, content))
