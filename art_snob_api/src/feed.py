import hashlib
import numpy as np
import pandas as pd
import copy
import random
import pickle

class DistanceClusterModel():
    
    def __init__(self, cluster_centers=None, key_map=None, nn_tree=None, distance_mat=None):
        self.cluster_centers = copy.deepcopy(cluster_centers)
        self.key_map = copy.deepcopy(key_map)
        self.nn_tree = copy.deepcopy(nn_tree)
        self.distance_mat = copy.deepcopy(distance_mat)
        
    def save(self, name='12012020-distance-cluster-model.pkl'):
        save_dict = {'cluster_centers': self.cluster_centers, 'key_map': self.key_map,
                    'nn_tree': self.nn_tree, 'distance_mat': self.distance_mat}
        
        with open(name, 'wb') as f:
            pickle.dump(save_dict, f)
        
    def load(self, name):
        with open(name, 'rb') as f:
            save_dict = pickle.load(f)
        
        self.cluster_centers = save_dict['cluster_centers']
        self.key_map = save_dict['key_map']
        self.nn_tree = save_dict['nn_tree']
        self.distance_mat = save_dict['distance_mat']

class ExploreExploitClusters():
    
    def __init__(self, distance_cluster_model, alpha=1.0, min_dist=6.0, exp_exl=0.1, 
    art_cluster_descriptions_file='art_cluster_descriptions.csv'):
        self.cluster_centers = distance_cluster_model.cluster_centers
        self.key_map = distance_cluster_model.key_map
        self.nn_tree = distance_cluster_model.nn_tree
        self.distance_mat = distance_cluster_model.distance_mat
        self.art_cluster_def = pd.read_csv(art_cluster_descriptions_file).to_dict()['Description']

        self.alpha = alpha
        self.min_dist = min_dist
        self.exp_exl = exp_exl
        self.exponential_drop = self.vectorized_drop()
    
    def cluster_center_art(self, cluster_num, n_ids=4):
        if cluster_num < len(self.cluster_centers):
            dist, n_idx = self.nn_tree.query([self.cluster_centers[cluster_num]], k=n_ids)
            return [int(k) for k in self.key_map[n_idx][0]]
        else:
            return []
    
    def vectorized_drop(self):
        f = lambda d: np.exp(max(d, self.min_dist)*-1*self.alpha)
        return np.vectorize(f)
    
    def preference_mask(self, idx=[]):

        size = len(self.cluster_centers)
        blank = np.zeros([size, size])

        for pid in idx:
            blank[pid, :] += np.array([1]*size)
            blank[:, pid] += np.array([1]*size).T
            blank[pid, pid] -= 1

        return blank
    
    def next_item(self, total_mask, likes, skip_n=0):
    
        masked_exp = np.multiply(self.exponential_drop(self.distance_mat), total_mask).sum(axis=0)
    
        if random.random() < self.exp_exl:
            print('EXPLOIT')
            sorted_mask = np.argsort(-1*masked_exp)
            for item in sorted_mask:
                if item not in likes:
                    if skip_n == 0:
                        return item
                    else:
                        skip_n -= 1
        else:
            print('EXPLORE')
            sorted_mask = np.argsort(np.abs(masked_exp))
            for item in sorted_mask:
                if item not in likes:
                    if skip_n == 0:
                        return item
                    else:
                        skip_n -= 1
    
    def predict_next(self, likes=[], dislikes=[], skip_n=0, art_ids=True, n_ids=5, n_start=0):
        
        mask = self.preference_mask(likes)
        neg_mask = self.preference_mask(dislikes)
        total_mask = mask - neg_mask
        
        if art_ids:
            item = self.next_item(total_mask, likes, skip_n)
            dist, n_idx = self.nn_tree.query([self.cluster_centers[item]], k=n_ids)
            return {'cluster': int(item), 'description': self.art_cluster_def[item]}, self.key_map[n_idx[:,n_start:n_ids]][0]
        else:
            return self.next_item(total_mask, likes, skip_n)
    

class PersonalizedArt():
    """Using a session ID for a hash get random and liked values"""
    def __init__(self, session_id, datahelper):
        self.session_id = session_id
        self.data = datahelper

    @property
    def hash(self):
        return int(hashlib.sha256(self.session_id.encode('utf-8')).hexdigest(), 16) % 10 ** 8

    @staticmethod
    def tags(art_infos):

        # todo: make a "tag store" with the tags and the mapped responses (then we can randomize more easily...)

        tag_counts = {}

        for art_info in art_infos:

            for tag in art_info['standard_tags']:

                if tag in tag_counts:
                    tag_counts[tag] += 1
                else:
                    tag_counts[tag] = 1

        # get sorted list of tags back
        return [t[0] for t in sorted(tag_counts.items(), key=lambda item: -1*item[1])]

    def recommended(self, seed_likes=None, start=0, n_per_carousal=25):
        """Index return... with both carousals and art..."""

        recommended = {}

        if not seed_likes:
            # seed_likes = self.data.get_user_likes(self.session_id)
            # seed_likes = [4508670551392256, 4511542676553728, 4630303488344064]
            seed_likes = [d for d in self.data.random(kind='frames-scraped-image-data', seed=self.hash, n_items=3)]

        # we can just make this a single feed (for now)
        similar_art = self.data.similar_art(seed_likes, hydrated=True)

        # eventually break this out!
        similar_art = {sa: similar_art[sa] for i,sa in enumerate(similar_art) if (i >= start and i < start + n_per_carousal)}
        
        recommended[f'art:{seed_likes[0]}'] = similar_art#[:n_per_carousal]

        # TODO: figure out tags, might not work since we're returning a dict..
        return recommended
    
    # def explore_feed(self):
    #     """Index return with both carousals and art"""
    #