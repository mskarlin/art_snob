import hashlib

# can we build a hypothesis based recommendation system?
# hypothesis: 1. similar items to what users like will generate more interactions
# hypothesis: 2. similar tags to what users like will generate more interactions
# hypothesis: content in carousal vs. feed evaluate how much someone likes tags??

# ok re-thinking this for a week, going to work from NN and tags only
# now let'd think of this as learning to rank: I've got some data on my backend
# users and what they click, and I've got features-- the tags & maybe a 2d embedding for the user's likes?
# need to keep track of what users are doing, then build a query to train the ranking model...
# this means at first we'll only use index relevance, then we can use rankings...
# but we should build in the ranking system

# for keeping track of "seen" items, we can write to the backend when a "session" is served to a user
# this session will have the art-ids viewed as well as the feed number
# then we can get the max feed number for a session

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

    def recommended(self, seed_likes=None, n_carousals=5, n_per_carousal=25):
        """Index return... with both carousals and art..."""

        recommended = {}

        if not seed_likes:
            # seed_likes = self.data.get_u ser_likes(self.session_id)
            seed_likes = [4508670551392256, 4511542676553728, 4630303488344064]

        # we can just make this a single feed (for now)
        similar_art = self.data.similar_art(seed_likes, hydrated=True)

        # eventually break this out!
        recommended[f'art:{seed_likes[0]}'] = similar_art[:n_per_carousal]

        tags = self.tags(similar_art)

        for tag in tags[:n_carousals]:
            recommended[f'tag:{tag}'] = self.data.search(tag)

        return recommended

    # def explore_feed(self):
    #     """Index return with both carousals and art"""
    #