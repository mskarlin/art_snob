import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for
)

from google.auth.transport import requests
import google.oauth2.id_token

from google.cloud import datastore

import random, os

# from datastore_helpers import update_multi

bp = Blueprint('artbrowse', __name__, url_prefix='/browse')
datastore_client = datastore.Client()
IMAGE_BUCKET_PREFIX = 'https://storage.googleapis.com/artsnob_images/'
firebase_request_adapter = requests.Request()



