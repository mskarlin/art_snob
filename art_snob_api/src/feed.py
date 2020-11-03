import hashlib

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

    def recommended(self, seed_likes=None, n_carousals=0, n_per_carousal=25):
        """Index return... with both carousals and art..."""

        recommended = {}

        if not seed_likes:
            # seed_likes = self.data.get_user_likes(self.session_id)
            # seed_likes = [4508670551392256, 4511542676553728, 4630303488344064]
            seed_likes = [d for d in self.data.random(kind='frames-scraped-image-data', seed=self.hash, n_items=3)]

        # we can just make this a single feed (for now)
        similar_art = self.data.similar_art(seed_likes, hydrated=True)

        # eventually break this out!
        similar_art = {sa: similar_art[sa] for i,sa in enumerate(similar_art) if i < n_per_carousal}
        recommended[f'art:{seed_likes[0]}'] = similar_art#[:n_per_carousal]

        # TODO: figure out tags, might not work since we're returning a dict..
        # tags = self.tags(similar_art)

        # how the fuck can we do this sorting?? should we just use SQL?
        # then the we can move the calculations onto the db...
        # get tag random selection... maybe
        # for that matter a way to optimize might be to take a key-only query

        # for tag in tags[:n_carousals]:
        #     recommended[f'tag:{tag}'] = self.data.search(tag)

        return recommended

    # def explore_feed(self):
    #     """Index return with both carousals and art"""
    #