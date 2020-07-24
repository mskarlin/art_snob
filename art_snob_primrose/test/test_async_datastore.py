"""Notes, need to modify the gcloud.aio.datastore.array function to allow for empty dict, {}
structures.

"""

import sys
import os
sys.path.insert(0,f'{os.getcwd()}/../art_snob_primrose/')
sys.path.insert(0,f'../')

from utilities.datastore_helpers import DataStoreInterface
import time

# get all the features from datastore
project='artsnob-1'
kind='scraped-image-data'
dsi = DataStoreInterface(project)


if __name__ == "__main__":

    test_queries = [[('standard_tags', '=', 'Drawing')],
                    [('standard_tags', '=', 'Digital')],
                    [('standard_tags', '=', 'Animals')],
                    [('standard_tags', '=', 'Artwork')],
                    [('standard_tags', '=', 'Pattern')],
                    [('standard_tags', '=', 'Dog')],
                    [('standard_tags', '=', 'Pet')]]
    test_kinds = [kind, kind, kind, kind, kind, kind, kind]

    start = time.time()
    out = dsi.async_queries(test_kinds, test_queries, 25)
    end = time.time()
    print(f'ASYNC TIME: {end-start}')

    start = time.time()
    syncout = []
    for q in test_queries:
        results = dsi.query(kind=kind,
                                 query_filters=q,
                                 n_records=25,
                                 tolist=True
                                 )[0]
        syncout += results
    end = time.time()
    print(f'SYNC TIME: {end-start}')
