# for when running locally
import sys
import os
# import logging
from starlette.middleware.cors import CORSMiddleware
import uvicorn
import uuid 
import time
import random as rand
import itertools
from datetime import datetime
from typing import List, Dict, Optional
from uuid import UUID

from pydantic import BaseModel

sys.path.insert(0, '../')
from utilities.datastore_helpers import DataStoreInterface
from utilities.storage_helpers import download_gcs_local
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException

import logging
import pickle
import copy
import google.cloud.logging # Don't conflict with standard logging
from google.cloud.logging.handlers import CloudLoggingHandler
from fastapi_cloudauth.firebase import FirebaseCurrentUser, FirebaseClaims

client = google.cloud.logging.Client()
handler = CloudLoggingHandler(client, name=os.environ.get('LOGGINGNAME', 'deco_api.dev'))
cloud_logger = logging.getLogger('cloudLogger')
cloud_logger.setLevel(logging.INFO) # defaults to WARN
cloud_logger.addHandler(handler)

from src.feed import PersonalizedArt, ExploreExploitClusters, DistanceClusterModel
from src.art_configurations import ArtConfigurations
from src.datastore_helpers import FriendlyDataStore
from jose.exceptions import JWTError

DISTANCE_CLUSTER_MODEL = os.environ.get('DISTANCE_CLUSTER_MODEL', '12012020-distance-cluster-model.pkl')
DCM_ALPHA = os.environ.get('DCM_ALPHA', '1.0')
DCM_MIN_DIST = os.environ.get('DCM_MIN_DIST', '6.0')
DCM_EXPLOIT_PCT = os.environ.get('DCM_EXPLOIT_PCT', '0.1')

dsi = DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))
data = FriendlyDataStore(dsi)
download_gcs_local('artsnob-models', 'clusters/'+DISTANCE_CLUSTER_MODEL, DISTANCE_CLUSTER_MODEL)

dcm = DistanceClusterModel()
dcm.load(DISTANCE_CLUSTER_MODEL)
eec = ExploreExploitClusters(dcm, 
                            alpha=float(DCM_ALPHA), 
                            min_dist=float(DCM_MIN_DIST), 
                            exp_exl=float(DCM_EXPLOIT_PCT))

app = FastAPI(title='deco-api', version="0.1.0")

origins = ["*", "http://localhost:8000/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ac = ArtConfigurations(fileloc=os.environ.get('ART_CONFIG_FILE', 'art_configurations.csv'))

# the below function won't actually catch... 
def get_current_user():
    try:
        return FirebaseCurrentUser()
    except:
        raise HTTPException(status_code=400)

@app.on_event("startup")
async def startup_event():
    ac.expand_all_templates()

# TODO: move the images URL appendage client side
def list_and_add_image_prefix(artdata: Dict, hydration_dict = None) -> List:  
    work_list = []
    for art, works in artdata.items():
        for idx, work in works.items():
            work['id'] = idx
            # work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
            if hydration_dict:
                work['metadata'] = hydration_dict[idx]
            work_list.append(work)
    return work_list

def add_image_prefix(artlist: List, ids:List=None):
    rlist = []
    if ids: 
        for i,al in enumerate(artlist):
            # al.update({'images': f"https://storage.googleapis.com/artsnob-image-scrape/{al['images']}"})
            al.update({'id': ids[i]})
            rlist.append(al)
        return rlist
    else: 
        return artlist

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

def cursor_parse(cursor):
    start, n_items = cursor.split('_')
    try:
        start = int(start)
        n_items = int(n_items)
    except:
        print('ERROR PARSING CURSOR')
        return 0, 25, '25_25'

    return (start, n_items, f'{n_items+start}_{n_items}')

@app.get("/feed/")
def feed(seed_likes:str='', session_id=None, start_cursor='0_25'):

    if not session_id:
        session_id = str(uuid.uuid4())

    start, n_items, next_cursor = cursor_parse(start_cursor)

    pa = PersonalizedArt(session_id, data)
    
    seed_likes = [int(s) for s in seed_likes.split(',') if s]

    recommendations = pa.recommended(seed_likes, start=start, n_per_carousal=n_items)

    # split up the art into what's needed
    work_list = list_and_add_image_prefix(recommendations)

    # recommendations.update({'session_id': session_id})
    return {'art': work_list, 'cursor': next_cursor}

@app.get("/random/")
def random(session_id=None, cursor='0_25', curated=True):

    if not session_id:
        session_id = str(uuid.uuid4())

    start, n_items = cursor.split('_')
    start = int(start)
    n_items = int(n_items)
    seed = rand.randint(0,10000)

    if not curated:
        works = data.random(n_items=n_items, seed=abs(hash(session_id)) % (10 ** 8), start=start)
        # split up the art into what's needed
        work_list = list_and_add_image_prefix({'art': works})
    else:
        vibes = dsi.query(kind = data.VIBES, n_records = 100, tolist = True)
        vibe_rep_art = [v['RepresentativeArt'] for v in vibes[0]]
        idx_to_request = [item for sublist in vibe_rep_art for item in sublist]
        works = dsi.read(ids=idx_to_request, kind=data.INFO_KIND, sorted_list=True)
        work_list = add_image_prefix(works, ids=idx_to_request)
        rand.Random(seed).shuffle(work_list)

        return {'art': work_list[:n_items], 'cursor': f"{start+n_items}_{n_items}"}

    # recommendations.update({'session_id': session_id})
    return {'art': work_list, 'cursor': f"{start+n_items}_{n_items}"}

@app.get('/tags/{tag}')
def tags(tag: str, start_cursor: str = None, n_records: int = 10, session_id=None, return_clusters=False):
    if not session_id:
        session_id = str(uuid.uuid4())
    
    seed = rand.randint(0,10000)
    start = 0

    if start_cursor:
        seed, start = start_cursor.split('_')
        seed = int(seed)
        start = int(start)

    works = []

    for t in tag.split('|'):
        tdata = data.tag([t.capitalize()], seed=seed, n_records=n_records, cursor=start_cursor)
        
        cluster_info = None

        if return_clusters: 
            idx_list = []
            for idx, work in tdata.items():
                idx_list.append(idx)
            cluster_info = dsi.read(ids=idx_list, kind=data.CLUSTER_INDEX, sorted_list=False)

        work_list = list_and_add_image_prefix({'art': tdata}, hydration_dict=cluster_info)

        works.append(work_list)

    works = [x for x in itertools.chain(*itertools.zip_longest(*works)) if x is not None]

    log_exposure(work_list, session_id, how=f"exposure:tags:{tag}")

    return {'art': works, 'cursor': f'{seed}_{start+n_records}'}

@app.get('/recommended/{session_id}')
def recommended(session_id=None, likes:str='', dislikes:str='', start_cursor=None, n_return=26):
    if not session_id:
        session_id = str(uuid.uuid4())

    # Need to add 1 for db indexing rules (no 0 index...)
    likes = [int(l)+1 for l in likes.split(',') if l]
    dislikes = [int(d)+1 for d in dislikes.split(',') if d]

    # sub in some randoms if we've got no likes
    if len(likes) == 0:
        likes = [rand.randint(0,99) for i in range(3)]

    # seed = rand.randint(0,10000)
    seed = abs(hash(session_id)) % (10 ** 5)
    start = 0

    if start_cursor:
        seed, start = start_cursor.split('_')
        seed = int(seed)
        start = int(start)

    works = []
    cdata = data.clusters(likes, seed=seed, cursor=start_cursor, n_records=int(n_return), session_id=session_id)
    work_list = list_and_add_image_prefix({'art': cdata})

    log_exposure(work_list, session_id, how=f"exposure:recommended:{likes}|{dislikes}")
    
    return {'art': work_list, 'cursor': f'{seed}_{start+int(n_return)}'}


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
def vibes(vibe=None, session_id=None, start_cursor=None, n_records=25, representative_art=True):
    if not session_id:
        session_id = str(uuid.uuid4())

    seed = rand.randint(0,10000)
    start = 0

    if start_cursor:
        seed, start = start_cursor.split('_')
        seed = int(seed)
        start = int(start)

    vibes = dsi.query(kind = data.VIBES, 
                n_records = 100, 
                tolist = True
                )
    if vibe:

        if representative_art:
            vibe_rep_art = [v['RepresentativeArt'] for v in vibes[0] if v['Vibes'].strip(' ').lower() == vibe.strip(' ').lower()]

            if vibe_rep_art:
                works = dsi.read(ids=vibe_rep_art[0], kind=data.INFO_KIND, sorted_list=True)
                work_list = add_image_prefix(works, ids=vibe_rep_art[0])
                return {'art': work_list, 'cursor': None}

            else:
                return {'art': None, 'cursor': None}

        else:
            # get the vibe of interest from object
            vibe_candidate = [v['Clusters'] for v in vibes[0] if v['Vibes'].strip(' ').lower() == vibe.strip(' ').lower()]
            if vibe_candidate:
                return recommended(session_id=session_id, 
                                likes=','.join([str(v) for v in vibe_candidate[0]]), 
                                dislikes='', 
                                start_cursor=start_cursor, 
                                n_return=n_records)
            else:
                return {'art': None, 'cursor': None}
    else:
        return {'vibes': vibes[0]}    

@app.get('/explore/{session_id}')
def explore(session_id=None, likes:str='', dislikes:str='', skip_n=0, n_return=6, n_start=0):
    
    if not session_id:
        session_id = str(uuid.uuid4())

    likes = [int(l) for l in likes.split(',') if l]
    dislikes = [int(d) for d in dislikes.split(',') if d]

    next_cluster, next_items = eec.predict_next(likes=likes, dislikes=dislikes, skip_n=int(skip_n), n_ids=int(n_return), n_start=int(n_start))
    next_items = [int(ni) for ni in next_items]

    # hydrate the items
    works = dsi.read(ids=next_items, kind=data.INFO_KIND, sorted_list=True)
    work_list = add_image_prefix(works, ids=next_items)

    log_exposure(work_list, session_id, how=f"exposure:explore:{next_cluster['cluster']}")

    next_cluster.update({'art': work_list})

    return next_cluster


@app.get('/clusters/{cluster_id}')
def clusters(cluster_id, session_id=None, n_return=4, from_center=False):
    
    if not session_id:
        session_id = str(uuid.uuid4())

    work_ids = eec.cluster_center_art(int(cluster_id), n_ids=int(n_return))
    works = dsi.read(ids=work_ids, kind=data.INFO_KIND, sorted_list=True)
    work_list = add_image_prefix(works, ids=work_ids)

    log_exposure(work_list, session_id, how=f"exposure:clusters:{cluster_id}")

    return {'art': work_list, 'cluster': int(cluster_id)}


@app.get('/likes/{session}')
def likes(session: str, n: int = 10):

    # todo: cache the start_cursors to be able to pull down a random one per tag
    art = data.get_user_likes(session, n)
    works = dsi.read(ids=list(set([int(a['item']) for a in art])), kind=data.INFO_KIND, sorted_list=True)
    work_list = add_image_prefix(works)

    log_exposure(work_list, session, how=f"exposure:likes")

    return {'art': work_list, 'cursor': None}


@app.get('/art/{art_id}')
def art(art_id: int, session_id=None, max_tags=5, return_clusters=True):
    
    if not session_id:
        session_id = str(uuid.uuid4())

    work = dsi.read(ids=[art_id], kind=data.INFO_KIND, sorted_list=True)[0]
    
    if return_clusters: 
        cluster_info = dsi.read(ids=[art_id], kind=data.CLUSTER_INDEX, sorted_list=False)
        if art_id in cluster_info:
            work['metadata'] = cluster_info[art_id]
            work['metadata'].update({'cluster_desc': eec.art_cluster_def[cluster_info[art_id]['cluster_id']]})
        else:
            work['metadata'] = {'cluster_id': -1}

    tag_scores = data.tag_scores([w.lower() for w in work['standard_tags']])
    
    # re-assign the standard tags to only the top 5 scores with over 10 links
    tag_scores = sorted([ts for ts in tag_scores if ts['count'] >= 10], key=lambda x: x['weighted_score'])

    tag_scores = ['-'.join([t.capitalize() for t in ts.key.id_or_name.split('-')]) for ts in tag_scores[:int(max_tags)]]

    work['standard_tags'] = tag_scores

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
def art_configurations(nworks:int=2, minprice:int=0, maxprice:int=999999, session_id=None, defaults=False):
    if not session_id:
        session_id = str(uuid.uuid4())
    
    if not defaults:
        eligible_works = ac.art_configurations(nworks)
        sorted_elig_works = sorted([e for e in eligible_works if e['minprice'] >= minprice and e['minprice'] <= maxprice], key=lambda x: x['minprice'])
        log_exposure(sorted_elig_works, session_id, how=f"exposure:configuration:{nworks}:{minprice}:{maxprice}")
        return {'art_configuration': sorted_elig_works}
    else:
        return {'art_configuration': ac.defaults()}

class Action(BaseModel):
    session: str
    action: str
    item: str

class PriceSize(BaseModel):
    size: str
    price: str
    type: str

class Art(BaseModel):
    standard_tags: List[str]
    images: str
    description: str
    checksum: str
    image_urls: List[str]
    name: str
    color_list: List[str]
    artist: str
    size_price_list: List[PriceSize]
    page_url: str

class RoomArt(Art):
    id: int
    size: str
    artId: str = None
    standard_tags: Optional[List[str]]
    images: Optional[str]
    description: Optional[str]
    checksum: Optional[str]
    image_urls: Optional[List[str]]
    name: Optional[str]
    color_list: Optional[List[str]]
    artist: Optional[str]
    size_price_list: Optional[List[PriceSize]]
    page_url: Optional[str]

class Room(BaseModel):
    name: str
    roomType: str
    art: List[RoomArt]
    arrangement: Dict
    arrangementSize: int
    clusterData: Dict
    id: str


class AppState(BaseModel):
    sessionId: str
    likedArt: List[Art]
    rooms: List[Room]


class SessionLogin(BaseModel):
    sessionId: str
    hashkey: str

@app.post('/actions/')
def actions(action: Action):
    data.write_action(action)
    log_exposure([{'tmp': None}], action.session, how=f"interaction:{action.action}", id=action.item)
    return action

@app.post('/state/')
def state(app_state: AppState, current_user: FirebaseClaims = Depends(get_current_user())):
    data.write_state(app_state)
    return 'posted!'

@app.post('/sessionlogin/')
def sessionlogin(login: SessionLogin, current_user: FirebaseClaims = Depends(get_current_user())) -> AppState:
    data.write_login(login)
    return data.get_state(login.hashkey)

@app.get('/session_state/{session}')
def session_state(session: str, current_user: FirebaseClaims = Depends(get_current_user())):
    return data.get_state(hashkey=None, session=session)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)