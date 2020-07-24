"""Simple application to use key value cached recommendation backend for art recommendations
    Copyright: Artsnob LLC 2018

"""
import random, os, uuid, datetime, re, logging
from random import shuffle
from flask import (Flask, render_template, request, session, jsonify)
from google.auth.transport import requests
import google.oauth2.id_token
from google.cloud import datastore
import sys
sys.path.append('../')
from utilities.datastore_helpers import DataStoreInterface

from artsnob.feed import PersonalizedArt
from artsnob.datastore_helpers import DatastoreInteractions, FriendlyDataStore

logging.basicConfig(level=logging.INFO)

# global variables
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x91&,'
app.permanent_session_lifetime = datetime.timedelta(days=365)  # 365 days of cookies will be saved

IMAGE_BUCKET_PREFIX = 'https://storage.googleapis.com/artsnob-image-scrape/'
RECOMMENDATION_TABLE = 'gcp_pca_recommendations'

dsi = DataStoreInterface(os.environ.get('GOOGLE_CLOUD_PROJECT'))
data = FriendlyDataStore(dsi)

firebase_request_adapter = requests.Request()


def session_modifications():
    session.permament = True

    if request.user_agent:
        session['agent'] = '{}:{}:{}'.format(request.user_agent.string,
                                             request.user_agent.platform,
                                             request.user_agent.browser)
    else:
        session['agent'] = ''

    if 'sid' not in session:
        session['sid'] = str(uuid.uuid4())
        logging.info('New session started: {}'.format(session['sid']))
    else:
        logging.info('Session found: {}'.format(session['sid']))

    # keep track of the first visit to deliver the splash or not
    if 'first_visit' not in session:
        logging.info('Noting the first session.')
        session['first_visit'] = 'yes'
    else:
        session['first_visit'] = 'no'

    # prep session for storing likes
    if 'likes' not in session:
        session['likes'] = []


def write_session_actions_to_datastore(email, time, action, object, agent):
    return di.update_multi([{
                             'email': email,
                             'time': time,
                             'action': action,
                             'object': object,
                             'agent': agent
                             }],
                           'action_stream')


def write_session_likes_to_db(user, liked_images):
    images_to_write = []

    for img in liked_images:
        like_dict = {}
        like_dict['email'] = user
        like_dict['action'] = 'liked'
        like_dict['object'] = img
        images_to_write.append(like_dict)

    logging.info('Writing newly-found session likes to datastore.')
    # write liked_list to the DB
    di.update_multi(images_to_write, 'action_stream')


@app.route('/', methods=['GET', 'POST'])
@app.route('/index<page>', methods=['GET', 'POST'])
def index(page=0, noshow=''):
    session_modifications()

    # set the feed session id for persistance
    pa = PersonalizedArt(session['sid'], data)

    header_class = None

    # Verify Firebase auth.
    id_token = request.cookies.get("token")
    user_email = None

    # user is logged in
    if id_token:
        pass
        # try:
        #     # may be able to cache this
        #     claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        #
        #     # set the feed email for persistance
        #     f.as_user_email = claims['email']
        #     user_email = claims['email']
        #
        #     # get user liked images
        #     liked_images = di.get_user_likes(claims['email'], 10)
        #
        #     # if the current session of likes aren't present, then add them for the user
        #     if len(set(session['likes']) - set(liked_images)) != 0:
        #         # write the current session to the database for this user
        #         write_session_likes_to_db(claims['email'], list(set(session['likes']) - set(liked_images)))
        #
        #     # logged in users don't see header
        #     header_class = 'class=hide'
        #
        # except ValueError as exc:
        #     # This will be raised if the token is expired or any other
        #     # verification checks fail.
        #     error_message = str(exc)
        #     logging.debug(error_message)
        #     liked_images = di.get_user_likes(session['sid'], 10)

    # else:

        # liked_images = data.get_user_likes(session['sid'], 10)

    if request.method == "POST":
        start_images = data.search(request.form['search'])
        header_class = 'class=hide'

    # else:
    #     logging.info('Pulling feed for session {}'.format(session['sid']))
    #
    #     seen_items = data.get_user_seen(f.session_uuid)
    #
    #     seen_keys, start_images = f.feed(di, likes=liked_images, n_recs=24, seen=seen_items)
    #
    #     shuffle(start_images)
    #
    #     di.write_user_seen(f.session_uuid, seen_keys)

    # start_images = list(zip(start_images, range(len(start_images))))
    #
    # abstract_images = di.search_results("abstract", tag_filter='movement', filter_type='>=')
    #
    # abstract_images = list(zip(abstract_images, range(len(abstract_images))))
    #
    # start_images = [['Recommendations', start_images], ['Abstract Art', abstract_images]]

    if session['first_visit'] == 'no':
        header_class = 'class=hide'

    if 'onboarded' in session:
        show_onboarding = not session['onboarded']
    else:
        show_onboarding = True

    art = pa.recommended()

    # write this session to the DB
    # write_session_actions_to_datastore(user_email if user_email is not None else session['sid'],
    #                                    datetime.datetime.now(),
    #                                    "load",
    #                                    "main_feed",
    #                                    session['agent'])

    return render_template('carousal_index.html', art=art, header_class=header_class,
                           hidden=' hidden' if header_class is None else '', liked_images=[],
                           tutorial=session['first_visit'] != 'no',
                           onboarding=show_onboarding)


@app.route('/profile', methods=['GET', 'POST'])
def profile():

    session_modifications()

    # Verify Firebase auth.
    id_token = request.cookies.get("token")
    user_email = None

    if request.method == "POST":
        start_images = search_datastore_tags(request.form['search'])
        start_images = list(zip(start_images, range(len(start_images))))
        header_class = 'class=hide'
        liked_images = di.get_user_likes(session['sid'])
        return render_template('index.html', start_images=start_images, header_class=header_class,
                               hidden='', liked_images=liked_images)

    if id_token:

        claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)

        user_email = claims['email']

        liked_images = di.get_user_likes(claims['email'])

        # if the current session of likes aren't present, then add them for the user
        if len(set(session['likes']) - set(liked_images)) != 0:
            # write the current session to the database for this user
            write_session_likes_to_db(claims['email'], list(set(session['likes']) - set(liked_images)))
            liked_images = list(set(session['likes'] + liked_images))

    else:

        liked_images = di.get_user_likes(session['sid'])

    recommended_images, interests = di.get_recommendations(liked_images, kind=RECOMMENDATION_TABLE, get_interests=True)

    under_100_recommendations = di.get_recommendations(liked_images,
                                                       kind=RECOMMENDATION_TABLE)

    liked_images = list(zip(liked_images, range(len(liked_images))))

    recommended_images = list(zip(recommended_images, range(len(recommended_images))))

    under_100_recommendations = list(zip(under_100_recommendations, range(len(under_100_recommendations))))

    # write this session to the DB
    write_session_actions_to_datastore(user_email if user_email is not None else session['sid'],
                                       datetime.datetime.now(),
                                       "load",
                                       "profile_gallery",
                                       session['agent'])

    return render_template('profile.html', recommended_images=recommended_images, liked_images=liked_images,
                           under_100_images=under_100_recommendations, interests=interests['movement_interests'])


def parse_image_details(image):
    host_page_dict = {'society6': 'Society-6', 'minted': 'Minted', 'saatchi': 'Saatchi'}

    # parse image details
    ds_image_query = datastore_client.query(kind='image_info')
    ds_image_query.add_filter('images', '=', 'full/' + image + '.jpg')
    ds_image = [imq for imq in ds_image_query.fetch()][0]

    description = {}

    description['title'] = ds_image['name']
    description['description'] = ds_image['description']
    try:
        description['price'] = ds_image['price']
    except:
        description['price'] = ' SOLD '

    description['sizes'] = ds_image['sizes']

    host_page = [host_page_dict[key] for key in host_page_dict if key in ds_image['page_url']]

    if not host_page:
        host_page = 'Source page'
    else:
        host_page = host_page[0]

    if host_page == 'Saatchi':
        description['description'] = 'See description on Saatchi!'

    description['domain'] = host_page
    description['link'] = ds_image['page_url']

    description['id'] = ds_image.id

    return description


@app.route('/detail<image>', methods=['GET', 'POST'])
def detail(image):
    """Show detailed information template"""

    session_modifications()

    # depricated
    # find what type of image the
    # img_cat = di.get_image_category('full/' + image + '.jpg')

    # depricated
    # update the distributions for the categories
    # f.update_ctr_numerator_factors(img_cat, 0.5)

    if request.method == "POST":
        start_images = search_datastore_tags(request.form['search'])
        start_images = list(zip(start_images, range(len(start_images))))
        header_class = 'class=hide'
        liked_images = di.get_user_likes(session['sid'])
        return render_template('index.html', start_images=start_images, header_class=header_class,
                               hidden='', liked_images=liked_images)

    description = parse_image_details(image)

    id_token = request.cookies.get("token")
    user_email = None

    if id_token:
        claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
        user_email = claims['email']
        liked_images = di.get_user_likes(claims['email'])
    else:
        liked_images = di.get_user_likes(session['sid'])

    similar_images, interests = di.get_recommendations(['full/' + image + '.jpg'], kind=RECOMMENDATION_TABLE, get_interests=True)
    similar_images = list(zip(similar_images, range(len(similar_images))))

    under_100_images = di.get_recommendations(['full/' + image + '.jpg'],
                                              kind=RECOMMENDATION_TABLE)
    under_100_images = list(zip(under_100_images, range(len(under_100_images))))

    # query tags
    ds_image_query = datastore_client.query(kind='image_tags')
    ds_image_query.add_filter('image_id', '=', description['id'])
    tags = [li['tags'] for li in ds_image_query.fetch(limit=1)]
    if len(tags) > 0:
        tags = [tag for tag in tags[0]]

    # session written to DB
    write_session_actions_to_datastore(user_email if user_email is not None else session['sid'],
                                       datetime.datetime.now(),
                                       "view",
                                       "detail_{}".format(image),
                                       session['agent'])

    if 'onboarded' in session:
        show_onboarding = not session['onboarded']
    else:
        show_onboarding = True

    return render_template('detail1.html', description=description,
                           image_url=IMAGE_BUCKET_PREFIX + 'full/' + image + '.jpg',
                           similar_images=similar_images, tags=tags, under_100_images=under_100_images,
                           liked_images=liked_images, onboarding=show_onboarding)


@app.route('/tags<tag>', methods=['GET', 'POST'])
def tags(tag):
    session_modifications()

    if request.method == "POST":
        start_images = search_datastore_tags(request.form['search'])
        start_images = list(zip(start_images, range(len(start_images))))
        header_class = 'class=hide'
        liked_images = di.get_user_likes(session['sid'])
        return render_template('index.html', start_images=start_images, header_class=header_class,
                               hidden='', liked_images=liked_images)

    ds_image_query = datastore_client.query(kind='image_tags')
    ds_image_query.add_filter('tags', '=', tag)
    image_ids = [li['image_id'] for li in ds_image_query.fetch(limit=25)]
    tag_list = di.ds_read(image_ids, 'image_info', 'images', force_int=True)
    tag_list = di.valid_image_check(tag_list)
    tag_list = [IMAGE_BUCKET_PREFIX + i for i in tag_list]
    header_class = 'class=hide'
    tag_list = list(zip(tag_list, range(len(tag_list))))

    return render_template('index.html', start_images=tag_list, header_class=header_class)


def extract_first_image(html_blob):
    first_src = html_blob.split('src=')[1]
    address = first_src[1:].split('.jpg')[0]

    return address + '.jpg'


def extract_h2_title(html_blob):
    first_h2 = html_blob.split('<h2>')[1]
    title = first_h2.split('</h2>')[0]
    return title


@app.route('/blog<blog_entry>')
def blog(blog_entry=-1):
    if 'sid' not in session:
        session['sid'] = str(uuid.uuid4())

    if int(blog_entry) == -1:
        print('LANDINGPAGE')
        # here is where we'll put the landing page
        ds_image_query = datastore_client.query(kind='blog_post')
        ds_image_query.add_filter('entry_id', '=', -1)
        blog_info = [li for li in ds_image_query.fetch(limit=1)][0]

        # get the rest of the blog articles and clean the data for the previews
        all_posts = datastore_client.query(kind='blog_post')
        all_posts.add_filter('entry_id', '>', -1)
        blog_previews = [li for li in all_posts.fetch(limit=10)]

        # parse image from html

        links = ['/blog{}'.format(blog['entry_id']) for blog in blog_previews]

        images = [extract_first_image(blog['blog_entry']) for blog in blog_previews]

        titles = [blog['blog_title'] for blog in blog_previews]

        text = [extract_h2_title(blog['blog_entry']) for blog in blog_previews]

        author = ['Article by the Art Snob team.'] * len(blog_previews)

        clean_blog_prev = [
            {'title': tit, 'preview_text': tex.strip('\u2014'), 'author': auth, 'image': img, 'link': lnk} for
            img, tit, tex, auth, lnk in
            zip(images, titles, text, author, links)]

        write_session_actions_to_datastore(session['sid'] ,
                                           datetime.datetime.now(),
                                           "view",
                                           "main_blog_page",
                                           session['agent'])

        return render_template('blog.html', blog_info=blog_info, blog_prevs=clean_blog_prev,
                               any_blog_prevs=len(clean_blog_prev) > 0, meta_content=None)

    else:
        ds_image_query = datastore_client.query(kind='blog_post')
        ds_image_query.add_filter('entry_id', '=', int(blog_entry))
        blog_info = [li for li in ds_image_query.fetch(limit=1)][0]

        write_session_actions_to_datastore(session['sid'],
                                           datetime.datetime.now(),
                                           "view",
                                           "blog_{}".format(blog_entry),
                                           session['agent'])

        return render_template('blog.html', blog_info=blog_info, blog_prevs=[None],
                               meta_content=extract_h2_title(blog_info['blog_entry']).strip('\u2014'))


@app.route('/tos')
def tos():
    return render_template('tos.html')


@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    search_term = request.args.get('q')
    ds_tag_query = datastore_client.query(kind='image_tags')
    ds_tag_query.add_filter('tags', '>=', search_term)
    tags = [li for tq in ds_tag_query.fetch(limit=10) for li in tq['tags']]
    tags = set([t for t in tags if search_term == t[:len(search_term)]])
    tags = sorted(list(tags))
    return jsonify(matching_results=tags)


@app.route('/logexternal', methods=('GET', 'POST'))
def logexternal():
    if request.method == 'POST':

        session_modifications()

        # reformat input image
        # reformat input image
        link = request.form['link']

        id_token = request.cookies.get("token")
        error_message = None

        if id_token:
            try:
                claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)
                write_session_actions_to_datastore(claims['email'],
                                                   datetime.datetime.now(),
                                                   "click_affiliate",
                                                   link,
                                                   session['agent'])

            except ValueError as exc:
                error_message = str(exc)

        else:
            # write to the DB with the session
            write_session_actions_to_datastore(session['sid'],
                                               datetime.datetime.now(),
                                               "click_affiliate",
                                               link,
                                               session['agent'])

        return '{}'


@app.route('/like', methods=('GET', 'POST'))
def create():
    if request.method == 'POST':

        # make sure a session variable exists
        if 'sid' not in session:
            session['sid'] = str(uuid.uuid4())

        # reformat input image
        img = request.form['img']
        img = img.split(' ')[-1]

        # find what type of image the user liked
        img_cat = di.get_image_category(img.split('artsnob_images/')[-1])

        # deprecated
        # update the distributions for the categories
        # f.update_ctr_numerator_factors(img_cat, 1.0)

        # write the like to session variable
        try:
            session['likes'] = session['likes'] + [img]
        except KeyError:
            session['likes'] = [img]

        id_token = request.cookies.get("token")
        error_message = None

        if id_token:
            try:
                claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)

                write_session_actions_to_datastore(claims['email'],
                                                   datetime.datetime.now(),
                                                   "liked",
                                                   img,
                                                   session['agent'])

            except ValueError as exc:
                error_message = str(exc)

        else:
            # write to the DB with the session
            write_session_actions_to_datastore(session['sid'],
                                               datetime.datetime.now(),
                                               "liked",
                                               img,
                                               session['agent'])

        return '{}'


@app.route('/onboarded', methods=('GET', 'POST'))
def onboarded():
    if request.method == 'POST':

        # make sure a session variable exists
        if 'sid' not in session:
            session['sid'] = str(uuid.uuid4())

        # write the like to session variable
        try:
            session['onboarded'] = True
        except KeyError:
            session['onboarded'] = True

        id_token = request.cookies.get("token")
        error_message = None

        if id_token:
            try:
                claims = google.oauth2.id_token.verify_firebase_token(id_token, firebase_request_adapter)

                write_session_actions_to_datastore(claims['email'],
                                                   datetime.datetime.now(),
                                                   "onboarded",
                                                   'artsnob',
                                                   session['agent'])


            except ValueError as exc:
                error_message = str(exc)

        else:
            # write to the DB with the session
            write_session_actions_to_datastore(session['sid'],
                                               datetime.datetime.now(),
                                               "onboarded",
                                               'artsnob',
                                               session['agent'])

        return '{}'
