# for when running locally
import sys
import os
# import logging
import uuid 
import time
import random as rand
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel

sys.path.insert(0, '../')
from utilities.datastore_helpers import DataStoreInterface
from fastapi import FastAPI, File, UploadFile
# from google.cloud import logging

# logging.basicConfig(level=logging.INFO)
# logging_client = logging.Client()
# # This log can be found in the Cloud Logging console under 'Custom Logs'.
# logger = logging_client.logger(os.environ.get('LOGGINGNAME', 'deco_api.dev'))
import logging
import google.cloud.logging # Don't conflict with standard logging
from google.cloud.logging.handlers import CloudLoggingHandler
client = google.cloud.logging.Client()
handler = CloudLoggingHandler(client, name=os.environ.get('LOGGINGNAME', 'deco_api.dev'))
cloud_logger = logging.getLogger('cloudLogger')
cloud_logger.setLevel(logging.INFO) # defaults to WARN
cloud_logger.addHandler(handler)


from src.feed import PersonalizedArt
from src.art_configurations import ArtConfigurations
from src.datastore_helpers import DatastoreInteractions, FriendlyDataStore

dsi = DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))
data = FriendlyDataStore(dsi)

app = FastAPI()

ac = ArtConfigurations(fileloc=os.environ.get('ART_CONFIG_FILE', 'art_configurations.csv'))

@app.on_event("startup")
async def startup_event():
    ac.expand_all_templates()

# TODO: move the images URL appendage client side
def list_and_add_image_prefix(artdata: Dict) -> List:  
    work_list = []
    for art, works in artdata.items():
        for idx, work in works.items():
            work['id'] = idx
            # work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
            work_list.append(work)
    return work_list

def add_image_prefix(artlist: List):
    rlist = []
    for al in artlist:
        # al.update({'images': f"https://storage.googleapis.com/artsnob-image-scrape/{al['images']}"})
        rlist.append(al)

    return rlist

def art_type_from_name(name):
    name_dict = {'xsmall', 'small', 'medium', 'large'}
    formal = name.split(' ')[0].lower().replace('-', '')
    l, h = int(name.split(' ')[1].replace('\"',"")), int(name.split(' ')[3].replace('\"',""))

    if l > h:
        return f'l_{formal}'
    elif h > l:
        return f"p_{formal}"
    else:
        return f"{formal}"

def log_exposure(work_list, session_id, how="exposure", id=None):
    """Add when an item is shown and how to the logs for summary calculations"""
    for rank, work in enumerate(work_list):
        to_log = {'rank': rank, 'session_id': session_id, 'how': how}
        if 'id' in work:
            to_log['id'] = work['id']
        elif id is not None:
            to_log['id'] = id
        elif 'name' in work:
            to_log['id'] = work['name']            

        cloud_logger.info(to_log)

@app.get("/feed/")
def feed(seed_likes=[], session_id=None):

    if not session_id:
        session_id = str(uuid.uuid4())

    pa = PersonalizedArt(session_id, data)
    
    recommendations = pa.recommended(seed_likes)

    # split up the art into what's needed
    work_list = list_and_add_image_prefix(recommendations)

    # recommendations.update({'session_id': session_id})
    return work_list

@app.get("/random/")
def random(session_id=None):

    if not session_id:
        session_id = str(uuid.uuid4())

    works = data.random(n_items=25, seed=rand.randint(0,10000))
    
    # split up the art into what's needed
    work_list = list_and_add_image_prefix({'art': works})

    # recommendations.update({'session_id': session_id})
    return work_list

@app.get('/tags/{tag}')
def tags(tag: str, start_cursor: str = None, n_records: int = 10, session_id=None):
    if not session_id:
        session_id = str(uuid.uuid4())

    seed = rand.randint(0,10000)
    works = data.tag([tag.capitalize()], seed=seed, n_records=n_records, cursor=start_cursor)
    work_list = list_and_add_image_prefix({'art': works})
    log_exposure(work_list, session_id, how=f"exposure:tags:{tag}")

    return {'art': work_list, 'cursor': f'{seed}_{n_records}'}


@app.get('/taglist/{session_id}')
def taglist(session_id=None, n: int = 300, min_score: float = 4.0):
    if not session_id:
        session_id = str(uuid.uuid4())

    tags = dsi.query(kind = data.TAG_SCORES, 
                n_records = n, 
                query_filters = [('weighted_score', '>', min_score)],
                tolist = True
                )

    return {'tags': sorted(tags[0], key=lambda x: -x['weighted_score'])}

@app.get('/vibes/{session_id}')
def vibes(session_id=None):
    if not session_id:
        session_id = str(uuid.uuid4())

    vibes = dsi.query(kind = data.VIBES, 
                n_records = 100, 
                tolist = True
                )
    
    return {'vibes': vibes[0]}    

@app.get('/likes/{session}')
def likes(session: str, n: int = 10):

    # todo: cache the start_cursors to be able to pull down a random one per tag
    art = data.get_user_likes(session, n)
    works = dsi.read(ids=list(set([int(a['item']) for a in art])), kind=data.INFO_KIND, sorted_list=True)
    work_list = add_image_prefix(works)

    log_exposure(work_list, session, how=f"exposure:likes")

    return {'art': work_list, 'cursor': None}


@app.get('/art/{art_id}')
def art(art_id: int, session_id=None):
    
    if not session_id:
        session_id = str(uuid.uuid4())

    work = dsi.read(ids=[art_id], kind=data.INFO_KIND, sorted_list=True)[0]
    # work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
    # work['prices'] = {art_type_from_name(x.split("--")[0]):x.split("--")[1] for x in "--".join(work['sizes'].split("| | |")).split("|")}
    log_exposure([work], session_id, how="exposure:detail", id=art_id)
    return work

@app.get('/similar_works/{art_id}')
def similar_works(art_id: int, start_cursor:int = 0, limit:int = 10, session_id=None):
    if not session_id:
        session_id = str(uuid.uuid4())
    works = data.similar_art([art_id], hydrated=True, interleaved_results=False, limit=limit+start_cursor, start=start_cursor)
    works = list_and_add_image_prefix({art_id: works})
    log_exposure(works, session_id, how=f"exposure:similar:{art_id}")
    return {'art': works, 'cursor': start_cursor+limit}

@app.get('/art_configurations/{nworks}')
def art_configurations(nworks:int=2, minprice:int=0, maxprice:int=999999, session_id=None):
    if not session_id:
        session_id = str(uuid.uuid4())
    eligible_works = ac.art_configurations(nworks)
    sorted_elig_works = sorted([e for e in eligible_works if e['minprice'] >= minprice and e['minprice'] <= maxprice], key=lambda x: x['minprice'])
    log_exposure(sorted_elig_works, session_id, how=f"exposure:configuration:{nworks}:{minprice}:{maxprice}")
    return {'art_configuration': sorted_elig_works}
            # 'metadata': {'unfilteredMin': unfiltered_min, 'unfilteredMax': unfiltered_max}}

class Action(BaseModel):
    session: str
    action: str
    item: str

@app.post('/actions/')
def actions(action: Action):
    data.write_action(action)
    log_exposure([{'tmp': None}], action.session, how=f"interaction:{action.action}", id=action.item)
    return action

