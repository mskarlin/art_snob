# for when running locally
import sys
import os
# import logging
from starlette.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict, Optional
from pydantic import BaseModel

from utilities.datastore_helpers import DataStoreInterface
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Body

import logging
import pickle
import requests
from bs4 import BeautifulSoup
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, PlainTextContent, HtmlContent, SendGridException

# todo, modify clip code to allow for local model placement, then copy it
# or just copy over the files into the docker image, and use a flex environment
app = FastAPI(title='artsnob-image-model-api', version="0.1.0")

origins = ["*", "http://localhost:8000/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dsi = DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))

import hashlib
def hash_item(s):
    return int(hashlib.sha256(s.encode('utf-8')).hexdigest(), 16) % 10**8
KIND='VACCINE_SCRAPE'

@app.get('/new_appointments/')
def new_appointments():
    r = requests.get('https://nycvaccinelist.com/?includeDose=unspecified')
    soup = BeautifulSoup(r.text, 'html.parser')
    locations = soup.find_all(class_="leading-6 mt-6")
    location_text = [l.get_text() for l in locations]
    no_vf = [l for l in location_text if 'See NYC Vaccine' not in l]
    no_second_dose = [l for l in no_vf if 'Second Dose' not in l]
    not_no_openings = [l for l in no_second_dose if 'No openings' not in l]
    zip_filter = [l for l in not_no_openings if ('zip codes' in l and '10023' in l) or 'zip codes' not in l]
    strip_updated = [l[:l.find('Updated ')]+l[l.find('Updated ')+30:] for l in zip_filter]
    not_age_65_up = [l for l in strip_updated if 'Age 65+ only' not in l]
    
    hashes = [hash_item(l) for l in not_age_65_up]
    hash_dict = {hash_item(l): l for l in not_age_65_up}
    result = dsi.read_nocache(ids=hashes, kind=KIND, sorted_list = False)
    rkeys = [k for k in result.keys()]
    new_stuff = [hash_dict[i] for i in hashes if i not in rkeys] 
    data_to_upload = [hash_item(l) for l in new_stuff]
    dsi.update(data_list=[{'info': ns} for ns in new_stuff], kind=KIND, exclude_from_indexes=('info',), ids=data_to_upload)
    
    if len(new_stuff) > 0:
        content = PlainTextContent(",\n\n".join(new_stuff))

        message = Mail(from_email=From('mike@decoart.io'),
                            to_emails=To('michael.skarlinski@gmail.com', 'chloecheimets@gmail.com'),
                            subject=Subject('new appointments detected!'),
                            plain_text_content=content)

        try:
            sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            response = sg.send(message)
            print(response.status_code)
            print(response.body)
            print(response.headers)

        except Exception as e:
            print(e.message)



@app.get("/_ah/warmup")
def warmup():
    return {'status': 'warming-up'}