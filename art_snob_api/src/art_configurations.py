import pandas as pd
import itertools as it
import json
import ast

ALL_TYPES = {'p_xsmall', 'l_xsmall', 'xsmall', 'p_small', 'l_small', 
'p_medium', 'l_medium', 'medium', 'p_large', 'l_large'}

NAMES = {'p_xsmall': 'extra small portrait', 
        'l_xsmall': 'extra small landscape', 
        'xsmall': 'extra small',
        'p_small': 'small portrait',
        'l_small': 'small landscape', 
        'p_medium': 'medium portrait',
        'l_medium': 'medium landscape',
        'medium': 'medium',
        'p_large': 'large portrait',
        'l_large': 'large landscape'}

SIZE_KEYS = {"s": {"p_xsmall", "l_xsmall", "xsmall", "p_small", "l_small"},
             "a": ALL_TYPES,
             "l": {'p_large', 'l_large'},
             "m": {'p_medium', 'l_medium', 'medium', 'p_large', 'l_large'},
             "w": {'p_xsmall', 'l_xsmall', 'xsmall', 'p_small', 'l_small', 
                    'p_medium', 'l_medium', 'medium'}}

PRICES = {'p_xsmall': [40, 60],
            'l_xsmall': [40, 60],
            'xsmall':  [40, 60],
            'p_small': [50, 70],
            'l_small': [50, 70],
            'p_medium': [70, 90],
            'l_medium': [70, 90],
            'medium': [80, 115],
            'p_large': [150, 200],
            'l_large': [150, 200]}


class ArtConfigurations():

    def __init__(self, fileloc):
        self.templates = pd.read_csv(fileloc)
        self.art_objects = {}

    @staticmethod
    def art_object(idx, size_key, art_type):

        if 'NULLFRAME' in size_key:
            art_id = 'NULLFRAME'
        else:
            art_id = None

        return {'id': idx, 'size': art_type[size_key[:2]], 'artId': art_id}

    def _expand_template(self, n, art, name, configuration):
        """ get list of art objects for this template
        """
        if isinstance(art, str):
            art = ast.literal_eval(art)

        permutations = {a[:2]: SIZE_KEYS[a[0]] for a in set(art)}

        sort_p_keys = sorted([a for a in permutations.keys()])

        # get all permutations of art types
        key_product = it.product(*[permutations[s] for s in sort_p_keys])

        # get the art product for each permutation
        art_types = [{s: vals[n] for n,s in enumerate(sort_p_keys)} 
                        for vals in key_product]
        
        art_configurations = []

        for art_type in art_types:
            this_configuration = {}
            this_configuration['art'] = [self.art_object(n+1, sk, art_type)
                for n, sk in enumerate(art)]
            this_configuration['minprice'] = sum([PRICES[a['size']][0] for a in this_configuration['art'] if a['artId']!='NULLFRAME'])
            this_configuration['maxprice'] = sum([PRICES[a['size']][1] for a in this_configuration['art'] if a['artId']!='NULLFRAME'])
            this_configuration['arrangement'] = json.loads(configuration)
            this_configuration['arrangementSize'] = n
            this_configuration['name'] = name.format(**{a: NAMES[art_type[a]] for a in art_type})

            art_configurations.append(this_configuration)

        return art_configurations

    def expand_all_templates(self):
        
        for idx, row in self.templates.iterrows():
            expanded_template = self._expand_template(row['nworks'], 
                                                row['art'], 
                                                row['name'], 
                                                row['configuration'])

            if row['nworks'] not in self.art_objects:
                self.art_objects[row['nworks']] = expanded_template
            else:
                self.art_objects[row['nworks']] += expanded_template

    def art_configurations(self, n):
        return self.art_objects.get(n)
