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
    VIBES = '12302020-vibes'
    TAG_REVERSE_INDEX = '11202020-tag_reverse_index'
    CLUSTER_REVERSE_INDEX = '11292020-inverse-cluster-index'
    CLUSTER_INDEX = '12122020-cluster-index'
    STATE_KIND = '12202020-state'
    STATE_LOGIN = '12202020-login'
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
    
    def write_state(self, state):
        self.dsi.update([{'state': state.dict()}], 
        exclude_from_indexes=('state',), kind=self.STATE_KIND,
        ids=[state.sessionId])
    
    def write_login(self, login):
        
        # first find out if there's already a session for this user
        session = self.dsi.read_nocache(ids=[login.hashkey], kind=self.STATE_LOGIN, sorted_list=True)
        
        if len(session) == 0:
            print('NO SESSION FOUND, CREATING USER')
            self.dsi.update([{'session_id': login.sessionId}],
            kind=self.STATE_LOGIN, ids=[login.hashkey])
        else:
            print('SESSION FOUND, USING USER')
            return session

    def get_state(self, hashkey, session=[]):
        
        if len(session) == 0:
            session = self.dsi.read_nocache(ids=[hashkey], kind=self.STATE_LOGIN, sorted_list=True)

        if len(session) > 0:
            
            session = session[0]['session_id']

            state = self.dsi.read_nocache(ids=[session], kind=self.STATE_KIND, sorted_list=True)

            if len(state) > 0:
                return state[0]['state']

            else:

                return None
        else:
            return None


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

    def tag_scores(self, tags: List[str]):
        return self.dsi.read(ids=tags, kind=self.TAG_SCORES, sorted_list=True)

    def tag(self, tags: List[str], seed=814, n_records:int=25, cursor:str=''):
        
        # extract cursor and turn into ints
        if cursor:
            rseed, start = cursor.split('_')
            rseed = int(rseed)
            start = int(start)

        else:
            rseed = int(seed)
            start = 0

        tag_keys = self.dsi.read(ids=tags, kind=self.TAG_REVERSE_INDEX, sorted_list=True)
        
        idx_to_request = []

        for keys in tag_keys:
            idx_to_request+=keys['keys']

        idx_to_request = list(set(idx_to_request))
        random.Random(rseed).shuffle(idx_to_request)

        return self.dsi.read(ids=idx_to_request[start:(start+n_records)], kind=self.INFO_KIND)

    @staticmethod
    def score(i, pos, neg):
        if i in pos:
            return 1.0
        elif i in neg:
            return -1.0
        else:
            return 0.0


    def member_neighbor_sets(self, session_id):
        # first we pull the session_id and likes for this user
        results, cursor = self.dsi.query_nocache(kind=self.ACTION_KIND,
                                     query_filters=[('session', '=', session_id)],
                                     n_records=100,
                                     tolist=True
                                     )

        # filter for just the liked, approved or added to rooms
        positive_ids_to_neighbor = [int(r['item']) for r in results if (r['action']=='action' or 'addtoroom' in r['action'] or r['action'] == 'reco_approve')]
        negative_ids_to_neighbor = [int(r['item']) for r in results if (r['action'] == 'reco_disapprove')]

        # remove any undo actions ( removes all for each )
        positive_undos = set([int(r['item']) for r in results if (r['action'] == 'UNDO_reco_approve')])
        negative_undos = set([int(r['item']) for r in results if (r['action'] == 'UNDO_reco_disapprove')])

        # todo -- this needs to be only removing one per undo...
        positive_ids_to_neighbor = [pin for pin in positive_ids_to_neighbor if pin not in positive_undos]
        negative_ids_to_neighbor = [nin for nin in negative_ids_to_neighbor if nin not in negative_undos]        

        pos_to_flatten = self.dsi.read(ids=positive_ids_to_neighbor, kind=self.NEIGHBOR_KIND, filter_keys=['neighbors'])
        neg_to_flatten = self.dsi.read(ids=negative_ids_to_neighbor, kind=self.NEIGHBOR_KIND, filter_keys=['neighbors'])
        
        pos_neighbors = [neighbor_list['neighbors'][:25] for neighbor_list in pos_to_flatten.values()]
        pos_neighbors = set([item for sublist in pos_neighbors for item in sublist])

        neg_neighbors = [neighbor_list['neighbors'][:25] for neighbor_list in neg_to_flatten.values()]
        neg_neighbors = set([item for sublist in neg_neighbors for item in sublist])

        return pos_neighbors, neg_neighbors

    def rerank_from_like_and_approvals(self, pos_neighbors, neg_neighbors, id_list_to_rank):

        if len(pos_neighbors) == 0 and len(neg_neighbors) == 0:
            return id_list_to_rank

        indexed_id_list_to_rank = [(i,self.score(i, pos_neighbors, neg_neighbors)) for i in id_list_to_rank]

        # remove what was below the threshold prior (that's all seen...)

        return [t[0] for t in sorted(indexed_id_list_to_rank, key=lambda x: x[1], reverse=True)]

    def clusters(self, clusters: List, seed=814, cursor:str='', n_records:int=26, session_id=None):
        
        if cursor:
            rseed, start = cursor.split('_')
            rseed = int(rseed)
            start = int(start)

        else:
            rseed = int(seed)
            start = 0

        cluster_keys = self.dsi.read(ids=clusters, kind=self.CLUSTER_REVERSE_INDEX, sorted_list=True)

        idx_to_request = []

        for keys in cluster_keys:
            tmp_cluster_ids = list(set([int(k) for k in keys['idx']]))
            random.Random(rseed).shuffle(tmp_cluster_ids)
            
            if session_id:
                pos_neighbors, neg_neighbors = self.member_neighbor_sets(session_id)
                tmp_cluster_ids = self.rerank_from_like_and_approvals(pos_neighbors, neg_neighbors, tmp_cluster_ids)[start:]

            idx_to_request.append(tmp_cluster_ids)
        
        idx_to_request = itertools.zip_longest(*idx_to_request)

        idx_to_request = [item for sublist in idx_to_request for item in sublist if item is not None]

        if session_id:
            return self.dsi.read(ids=idx_to_request[:n_records], kind=self.INFO_KIND)
        else:
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

    def random(self, kind=None, seed=814, start=0, n_items=1):

        if kind is None:
            kind = self.INFO_KIND

        rand = random.Random(seed).randint(self.RAND_MIN, self.RAND_MAX)

        keys = self.dsi.read(ids=[rand], kind=self.RANDOM_INDEX_KIND)
        keys = keys[rand]['random_keys'][start:start+n_items]

        return self.dsi.read(ids=keys, kind=kind)
