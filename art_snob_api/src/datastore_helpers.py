import random, datetime
from google.cloud import datastore
import os
from src.ordered_set import OrderedSet
from typing import List
import itertools
import sys

sys.path.append('../')
from utilities.datastore_helpers import DataStoreInterface
import time


def roundrobin(*iterables):
    "roundrobin('ABC', 'D', 'EF') --> A D E B F C"
    # Recipe credited to George Sakkis
    num_active = len(iterables)
    nexts = itertools.cycle(iter(it).__next__ for it in iterables)
    while num_active:
        try:
            for next in nexts:
                yield next()
        except StopIteration:
            # Remove the iterator we just exhausted from the cycle.
            num_active -= 1
            nexts = itertools.cycle(itertools.islice(nexts, num_active))


class FriendlyDataStore():
    ACTION_KIND = 'prod-action-stream'
    INFO_KIND = 'frames-scraped-image-data'
    RANDOM_INDEX_KIND = '10232020-random_selections'
    NEIGHBOR_KIND = '10232020-pca-nn'
    IMAGE_BUCKET_PREFIX = 'https://storage.googleapis.com/artsnob-image-scrape/'
    TAG_SCORES = '11122020-tag-scores'
    VIBES = '11152020-vibes'
    TAG_REVERSE_INDEX = '11202020-tag_reverse_index'
    # RAND_MIN = 4503653962481664  # used for scraped-image-data indices
    # RAND_MAX = 6755350696951808
    RAND_MIN = 1
    RAND_MAX = 10001

    def __init__(self, dsi=None):
        self.dsi = dsi if dsi else DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))

    def write_action(self, action):
        write_dict = {}
        write_dict['session'] = action.session
        write_dict['action'] = action.action
        write_dict['item'] = action.item
        write_dict['time'] = datetime.datetime.now()
        self.dsi.update([write_dict], kind=self.ACTION_KIND)

    def get_user_likes(self, user, cutoff=10):
        """Get all objects that a user has liked"""
        return self.dsi.query(kind=self.ACTION_KIND,
                              query_filters=[('session', '=', user),
                                             ('action', '=', 'liked')],
                              n_records=cutoff,
                              tolist=True
                              )[0]

    def get_user_seen(self, user):
        """Get all objects that a user has liked"""
        # first query all the likes that a user had done while logged in
        seen_lists = self.dsi.query(kind=self.ACTION_KIND,
                                    query_filters=[('email', '=', user),
                                                   ('action', '=', 'feed_seen')],
                                    n_records=10,
                                    tolist=True
                                    )[0]
        logged_likes = []

        for seen in seen_lists:
            logged_likes += seen.split('|')

        return logged_likes

    def similar_art(self, id_list, hydrated=False, interleaved_results=True, limit=None, start=0):
        """Get all similar art to the id list"""

        id_set = OrderedSet(id_list)

        to_flatten = self.dsi.read(ids=id_set, kind=self.NEIGHBOR_KIND, filter_keys=['neighbors'])

        # flatten and de-dupe the result
        if interleaved_results:

            _aid_lists = [neighbor_list['neighbors'] for neighbor_list in to_flatten.values()]
            unique_art = list(OrderedSet(roundrobin(*_aid_lists)))

        else:

            unique_art = list(
                OrderedSet([aid for neighbor_list in to_flatten.values() for aid in neighbor_list['neighbors']]))

        # remove the items themselves
        unique_art = [aid for aid in unique_art if aid not in id_set]

        if limit:
            unique_art = unique_art[start:limit]

        if hydrated:
            unique_art = self.dsi.read(ids=unique_art, kind=self.INFO_KIND, sorted_list=False)

        return unique_art


    def tag(self, tags: List[str], seed=814, n_records:int=25, cursor:str=''):
        
        # extract cursor and turn into ints
        if cursor:
            rseed, start = cursor.split('_')
            rseed = int(rseed)
            start = int(start)

        else:
            rseed = int(seed)
            start = 0

        random.seed(rseed)

        tag_keys = self.dsi.read(ids=tags, kind=self.TAG_REVERSE_INDEX, sorted_list=True)
        
        idx_to_request = []

        for keys in tag_keys:
            idx_to_request+=keys['keys']

        idx_to_request = list(set(idx_to_request))
        random.shuffle(idx_to_request)

        return self.dsi.read(ids=idx_to_request[start:(start+n_records)], kind=self.INFO_KIND)


    def search(self, query, get_cursor=False, start_cursor=None, n_records=25):
        """Get all search results based on tags"""
        queries = query.lower().split(' ')

        search_results = []

        for q in queries:
            results, cursor = self.dsi.query(kind=self.INFO_KIND,
                                     query_filters=[('standard_tags', '=', q.capitalize())],
                                     n_records=n_records,
                                     cursor=start_cursor,
                                     tolist=True
                                     )
            search_results += results

        if not get_cursor:
            return search_results
        else:
            return search_results, cursor

    def random(self, kind=None, seed=814, n_items=1):

        if kind is None:
            kind = self.INFO_KIND

        random.seed(seed)

        rand = random.randint(self.RAND_MIN, self.RAND_MAX)

        keys = self.dsi.read(ids=[rand], kind=self.RANDOM_INDEX_KIND)
        keys = keys[rand]['random_keys'][:n_items]

        return self.dsi.read(ids=keys, kind=kind)


class DatastoreInteractions:
    IMAGE_INFO_TABLE = 'gcp_cf_image_info'

    def __init__(self, datastore_client, image_bucket_prefix):
        self.ds = datastore_client
        self.image_bucket_prefix = image_bucket_prefix

    def ds_read(self, ids, top_level_key, return_key, force_int=False):
        """list of ids to read from ds in toplevelkey(ds index) and return a return_key value
           ds: datastore client
           ids: list of ids to pull from toplevelkey
           return_key = string or list of strings that we want to return from the ds index

        """
        if force_int:

            keys = [self.ds.key(top_level_key, int(id)) for id in ids]
            results = self.ds.get_multi(keys)
            if isinstance(return_key, str):
                id_to_key = {int(r.id): r[return_key] for r in results}
            else:
                id_to_key = {int(r.id): {rk: r[rk] for rk in return_key} for r in results}

            return [id_to_key[int(id)] for id in ids]

        else:

            keys = [self.ds.key(top_level_key, id) for id in ids]
            results = self.ds.get_multi(keys)

            if isinstance(return_key, str):
                id_to_key = {r.key.name: r[return_key] for r in results}

            else:
                id_to_key = {r.key.name: {rk: r[rk] for rk in return_key} for r in results}

            return [id_to_key[id] for id in ids]

    def update_multi(self, data_list, keyname, id=None):
        """Put a list of dicts into datastore with the corresponding schema

        :param ds: datastore client
        :param data_list: list of dicts to insert
        :param keyname: toplevelkey to insert into datastore
        :param id: id if we want to update a particular id
        :return: nothing, side effect is that data is uploaded
        """
        if data_list:

            split_list = [data_list[i * 500:(i + 1) * 500] for i in range(int(len(data_list) / 500) + 1)]

            for chunk in split_list:

                if id:
                    key = self.ds.key(keyname, id)
                else:
                    key = self.ds.key(keyname)

                entities = [datastore.Entity(key=key) for i in range(len(chunk))]

                for d, entity in enumerate(entities):
                    entity.update(chunk[d])

                self.ds.put_multi(entities)

    def update_multi_w_ids(self, data_list, keyname, exclude_from_indexes=None, ids=None):
        if data_list:

            split_list = [data_list[i * 500:(i + 1) * 500] for i in range(int(len(data_list) / 500) + 1)]

            if ids:
                id_list = [ids[i * 500:(i + 1) * 500] for i in range(int(len(ids) / 500) + 1)]

            for v, chunk in enumerate(split_list):

                if ids:
                    key = [self.ds.key(keyname, i) for i in id_list[v]]
                else:
                    key = self.ds.key(keyname)

                if exclude_from_indexes is not None:
                    try:
                        entities = [datastore.Entity(key=key[i], exclude_from_indexes=exclude_from_indexes) for i in
                                    range(len(chunk))]
                    except TypeError:
                        entities = [datastore.Entity(key=key, exclude_from_indexes=exclude_from_indexes) for i in
                                    range(len(chunk))]
                else:
                    try:
                        entities = [datastore.Entity(key=key[i]) for i in range(len(chunk))]
                    except:
                        entities = [datastore.Entity(key=key) for i in range(len(chunk))]

                for d, entity in enumerate(entities):
                    entity.update(chunk[d])

                self.ds.put_multi(entities)

    def get_recommendations(self, liked_list, kind='gcp_pca_recommendations', get_interests=False):
        """get recommendations using the pre-cached recommendations in datastore
           algorithm: take everything they like, get the most smilar, and zip together the results
        """
        # get per liked-image recommendations
        recommendations = self.ds_read([image.split('full/')[-1][:-4] for image in liked_list], kind,
                                       ['recommendations_urls',
                                        'movement_interests',
                                        'tag_interests',
                                        'visual_interests'])

        # trim down to 24 per liked image
        trim_len = len('gs://artsnob_images/')
        url_recommendations = [y[trim_len:] for x in recommendations for y in x['recommendations_urls'][:24]]
        recommendation_images = [self.image_bucket_prefix + r for r in url_recommendations]

        # re-organize to zip together -- basically every nth item goes at spot n
        recommendation_images = [recommendation_images[i * (24):(i + 1) * (24)] for i in
                                 range(len(liked_list))]

        zipped_recos = zip(*recommendation_images)

        final_rec = list(OrderedSet(list([item for tempList in zipped_recos for item in tempList])))

        # filter out liked images, control for the fact that the image bucket prefix pay already be included
        final_rec = [f for f in final_rec if
                     f not in [self.image_bucket_prefix + i if i[:5] != 'https' else i for i in liked_list]][:24]

        if get_interests:
            user_interests = self.user_interests(recommendations)
            return final_rec, user_interests

        else:

            return final_rec

    def user_interests(self, interest_dicts, n_per_group=5):

        interests = ['movement_interests', 'tag_interests', 'visual_interests']

        total_interest = {i: {} for i in interests}

        for interest_dict in interest_dicts:

            for interest in interests:

                for interest_group in interest_dict[interest]:

                    if interest_group in total_interest[interest]:

                        total_interest[interest][interest_group] += interest_dict[interest][interest_group]

                    else:
                        total_interest[interest][interest_group] = interest_dict[interest][interest_group]

        for interest in interests:
            top_interest_groups = sorted([v[0] for v in zip(total_interest[interest].items())], key=lambda x: x[1],
                                         reverse=True)

            total_interest[interest] = [tig[0] for tig in top_interest_groups][:n_per_group]

        return total_interest

    @staticmethod
    def get_randomly_deep_cursor(query, randint):
        """Need to come up with a better implementatino of this"""
        cursor = None

        for c in range(randint):
            print(c, cursor)
            query_iter = query.fetch(start_cursor=cursor, limit=1000)
            page = next(query_iter.pages)
            cursor = query_iter.next_page_token

        return cursor

    def get_random_images(self, seed=555, n=30):
        """Get a list of random images"""
        # query images from dataloc to get a long list
        ds_image_query = self.ds.query(kind=self.IMAGE_INFO_TABLE)
        current_ds_image_info = [q for q in ds_image_query.fetch(limit=500)]
        current_ds_images_set = set([q['images'] for q in current_ds_image_info])
        random.seed(seed)
        return [self.image_bucket_prefix + random.choice(list(current_ds_images_set)) for i in range(n)]

    def get_user_likes(self, user, lim=None):
        """Get all objects that a user has liked"""
        # first query all the likes that a user had done while logged in
        ds_image_query = self.ds.query(kind='action_stream')
        ds_image_query.add_filter('email', '=', user)
        ds_image_query.add_filter('action', '=', 'liked')
        # ds_image_query.order = ['-time']
        logged_likes = list(set([li['object'] for li in ds_image_query.fetch(limit=lim)]))
        return logged_likes

    def get_tags_seen(self, user, lim=None):
        """Get all categorical tags from images liked by each user"""

        likes = self.get_user_likes(user, lim=lim)

        cutoff_len = len('https://storage.googleapis.com/artsnob_images/full/')

        filtered_likes = [l[cutoff_len:] for l in likes]

        user_liked_tags = {'movement_tags': [], 'standard_tags': [], 'visual_tags': []}

        for fl in filtered_likes:
            ds_tag_query = self.ds.query(kind=self.IMAGE_INFO_TABLE)
            ds_tag_query.projection = ['movement', 'standard_tags', 'visual']
            ds_tag_query.add_filter('images', '=', fl)
            tags = [tags for tags in ds_tag_query.fetch(limit=1)]
            if tags:
                tag = tags.pop()
                user_liked_tags['movement_tags'] += tag['movement']
                user_liked_tags['standard_tags'] += tag['standard_tags']
                user_liked_tags['visual_tags'] += tag['visual']

        return user_liked_tags

    def get_user_seen(self, user):
        """Get all objects that a user has liked"""
        # first query all the likes that a user had done while logged in
        ds_image_query = self.ds.query(kind='action_stream')
        ds_image_query.add_filter('email', '=', user)
        ds_image_query.add_filter('action', '=', 'feed_seen')

        logged_likes = [li['object'].split('|') for li in ds_image_query.fetch()]

        print('SEEN ITEMS: {}'.format(logged_likes))

        return [l for likes in logged_likes for l in likes]

    def write_user_seen(self, user, objects):
        """Write all objects that a user has seen concatenated into a string"""
        like_dict = {}
        like_dict['email'] = user
        like_dict['action'] = 'feed_seen'
        like_dict['object'] = '|'.join([str(o) for o in objects])
        like_dict['time'] = datetime.datetime.now()

        # write liked_list to the DB
        self.update_multi([like_dict], 'action_stream')

        return True

    def valid_image_check(self, image_list):

        """filters for only images that are valid"""

        valid_bool = self.ds_read(image_list, 'valid_artwork', 'valid', force_int=False)

        return [i for n, i in enumerate(image_list) if valid_bool[n]]

    def search_results(self, query, tag_filter='standard_tags', filter_type='='):

        # break up query
        queries = query.lower().split(' ')

        search_results = []

        for q in queries:
            ds_image_query = self.ds.query(kind=self.IMAGE_INFO_TABLE)
            ds_image_query.add_filter(tag_filter, filter_type, q)
            search_list = ['full/' + li['images'] for li in ds_image_query.fetch(limit=25)]
            search_list = [self.image_bucket_prefix + i for i in search_list]
            search_results += search_list

        return search_results

    def get_random_art_category(self, rand_num=None):

        if rand_num is None:
            rand_num = 1

        random_images = self.ds_read([rand_num], 'random_image_lists', 'random_images', force_int=True)

        # need to de-nest the list and add prefix

        return [self.image_bucket_prefix + i for i in random_images[0]]

    def get_image_category(self, img):

        print('Image to be seached for: {}'.format(img))
        ds_image_query = self.ds.query(kind='pca_classification')
        ds_image_query.add_filter('image_name', '=', img)
        label = [li['label'] for li in ds_image_query.fetch(limit=1)]

        if len(label) > 0:
            print('Label fetched: {}'.format(label))
            return label[0]
        else:
            return None

    @staticmethod
    def color_min_max(hue, hue_range=5):
        if hue - hue_range < 0:
            color_min = 360 + (hue - hue_range)
        else:
            color_min = hue - hue_range

        if hue + hue_range > 360:
            color_max = (hue + hue_range) - 360
        else:
            color_max = hue + hue_range

        return color_min, color_max

    def get_color_similar(self, img):

        ds_image_query = self.ds.query(kind='image_color_data')
        ds_image_query.add_filter('image_name', '=', img)
        color_info = [(ci['fraction'], ci['hue'], ci['sat'], ci['val']) for ci in ds_image_query.fetch()]
        dominant_sorted_color = sorted(color_info, key=lambda x: x[0])[-1]

        # query the same color
        color_min, color_max = self.color_min_max(dominant_sorted_color[1], 5)
        ds_image_query = self.ds.query(kind='image_color_data')
        ds_image_query.add_filter('hue', '>', color_min)
        ds_image_query.add_filter('hue', '<', color_max)
        vals = [i for i in ds_image_query.fetch(limit=10)]
        print('VALS: {}'.format(vals))
        similar_color_art = [a['image_name'].decode("utf-8") for a in vals]
        return [self.image_bucket_prefix + i for i in similar_color_art]
