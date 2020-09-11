# for when running locally
import sys
import os
import logging
import uuid 
import time
from typing import List

sys.path.insert(0, '../')
from utilities.datastore_helpers import DataStoreInterface
from fastapi import FastAPI, File, UploadFile

logging.basicConfig(level=logging.INFO)

from src.feed import PersonalizedArt
from src.datastore_helpers import DatastoreInteractions, FriendlyDataStore

dsi = DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))
data = FriendlyDataStore(dsi)

app = FastAPI()


@app.get("/feed/")
def feed(seed_likes=[], session_id=None):

    if not session_id:
        session_id = str(uuid.uuid4())

    pa = PersonalizedArt(session_id, data)
    
    recommendations = pa.recommended(seed_likes)

    # split up the art into what's needed
    work_list = []
    for art, works in recommendations.items():
        for idx, work in works.items():
            work['id'] = idx
            work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
            work_list.append(work)

    # recommendations.update({'session_id': session_id})

    return work_list

@app.get('/art/{art_id}')
def art(art_id: int):
    work = dsi.read([art_id], data.INFO_KIND, sorted_list=True)[0]
    work['images'] = f"https://storage.googleapis.com/artsnob-image-scrape/{work['images']}"
    return work