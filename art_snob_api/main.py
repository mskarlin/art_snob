# for when running locally
import sys
import os
import logging
import uuid 
import time
from typing import List, Dict

sys.path.insert(0, '../')
from utilities.datastore_helpers import DataStoreInterface
from fastapi import FastAPI, File, UploadFile

logging.basicConfig(level=logging.INFO)

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

def list_and_add_image_prefix(artdata: Dict) -> List:  
    work_list = []
    for art, works in artdata.items():
        for idx, work in works.items():
            work['id'] = idx
            work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
            work_list.append(work)
    return work_list

def add_image_prefix(artlist: List):
    rlist = []
    for al in artlist:
        al.update({'images': f"https://storage.googleapis.com/artsnob-image-scrape/{al['images']}"})
        rlist.append(al)
    return rlist

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

@app.get('/tags/{tag}')
def tags(tag: str, start_cursor: str = None, n_records: int = 10):
    art, cursor = data.search(tag, 
                              get_cursor=True, 
                              n_records=n_records,
                              start_cursor=start_cursor)
    work_list = add_image_prefix(art)
    return {'art': work_list, 'cursor': cursor}

@app.get('/art/{art_id}')
def art(art_id: int):
    work = dsi.read([art_id], data.INFO_KIND, sorted_list=True)[0]
    work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
    return work

@app.get('/similar_works/{art_id}')
def similar_works(art_id: int, start_cursor:int = 0, limit:int = 10):
    works = data.similar_art([art_id], hydrated=True, interleaved_results=False, limit=limit+start_cursor, start=start_cursor)
    return {'art': list_and_add_image_prefix({art_id: works}), 'cursor': start_cursor+limit}

@app.get('/art_configurations/{nworks}')
def art_configurations(nworks:int=2, minprice:int=0, maxprice:int=999999):
    eligible_works = ac.art_configurations(nworks)
    # unfiltered_min = min([e['minprice'] for e in eligible_works])
    # unfiltered_max = max([e['minprice'] for e in eligible_works])
    return {'art_configuration': sorted([e for e in eligible_works if e['minprice'] >= minprice and e['minprice'] <= maxprice], key=lambda x: x['minprice'])}
            # 'metadata': {'unfilteredMin': unfiltered_min, 'unfilteredMax': unfiltered_max}}
