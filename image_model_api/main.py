# for when running locally
import sys
import os
# import logging
from starlette.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict, Optional
from pydantic import BaseModel

# from utilities.storage_helpers import upload_gcs_file
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Body

import logging
import pickle

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
import clip
import torch
import numpy as np

# Load the model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load('ViT-B/32', device)

# load in keylist and numpy array
with open('models/clip_model_clip_vector_keys.txt', 'r') as f:
    keys = np.array([int(k) for k in f.readlines()])

vectors = np.load('models/clip_model_clip_image_features.npy')

@app.get("/query_encoding/")
def query_encoding(query: str):

    text = clip.tokenize([query]).to(device)

    with torch.no_grad():
        text_features = model.encode_text(text)
        text_features /= text_features.norm(dim=-1, keepdim=True)

    return text_features.cpu().numpy()[0].tolist()

@app.get("/semantic_neighbors/")
def semantic_neighbors(query: str, n_start: int = 0, n_neighbors: int = 100):

    text = clip.tokenize([query]).to(device)

    with torch.no_grad():
        text_features = model.encode_text(text)
        text_features /= text_features.norm(dim=-1, keepdim=True)

    semantic_products = vectors.dot(text_features.cpu().numpy()[0])
    sn = (-1*semantic_products).argsort()
    
    return {'neighbors': keys[sn][n_start:n_start+n_neighbors].tolist()}

@app.get("/_ah/warmup")
def warmup():
    return {'status': 'warming-up'}