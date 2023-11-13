# Art Snob infrastructure

[Infrastructure](https://medium.com/@michael.skarlinski/architecture-behind-scalable-dynamic-art-recommendations-316a2d886cf0) to support an art search engine, including:
* Web scraping (`/art_snob_scrape`)
* Offline feature engineering + storage (`/art_snob_primrose`)
* Backend to serve index+ranking based feeds (`/art_snob_api`)
* Semantic search (`/image_model_api`)
* Frontend to support browsing, affiliate links, and recommendation serving  (`/art_snob_frontend`)

## Deployment and Operations

The set of services required to deploy and run Art Snob are configured to run in GCP via gcloud ai-platform and app-engine. Note there can be fairly substantial resources ($$$) required to host these services and run the offline jobs to generate data, so please be careful when deploying on your own infrastructure.

App configuration can be found in each subdirectory (i.e. replicas, node size, ...), and can be built and deployed via the Makefile in the root directory. [Docker](https://docs.docker.com/engine/install/) and the [gcloud cli](https://cloud.google.com/sdk/docs/install) must be installed to build and deploy.

1. Build the scraping image + the primrose images to be used for downstream art scraping as well as offline embedding generation
```
export PROJECT=<my gcp project name>
export GCP_REGION=<my gcp project region>
make build-scrape && make build-primrose 
```

2. After building + pushing the images above, we're ready to start orchestrating ephemeral resources to do work. As of 2019, there wasn't a great way to run arbitrary Docker "jobs" (i.e. not services) and shut them down outside of using GKS, which has a pretty substantial ops overhead (in AWS, the "batch" product solves this). So here, we "hack" the GCP ai-platform to allow us to run arbitrary docker jobs. To run our scraper we do the following: 
```
make submit-scrape-job
```

In viewing the code in `art_snob_scrape/`, you can see that there is only a single site implemented which, at the time of writing, art-snob was an affiliate partner. Many other sites were scraped using an identical infrastructure, however these have been removed from the repo as the affiliate agreements expired, no need to accost their servers with more scraping. **If running, do not increase the target concurrency or increase the replicas via multiple job submissions.** Your service will be likely be filtered a la a DDOS attack, so be responsible. 

This will populate a GCP bucket with images, and write all associated metadata to models in a [Datastore](https://cloud.google.com/datastore) noSQL db. Logs are accessible via the ai-platform job interface in your GCP project. 

3. **OPTIONAL** You'll need lots of variants of these image sizes (thumbnail, preview, large-scale), so we also have included a boilerplate cloud-function (see `cloud_functions`) to resize all of your images. **This code isn't included in the repo**, but you must deploy the linked function and set up a listener on your above bucket. This can be used to create many size variants of images. Otherwise, you'll end up using the same size (i.e. large) for all tasks following this step. 

4. Next, you'll need to submit jobs to embed the images into vectors, compress that representation (via [UMAP](https://umap-learn.readthedocs.io/en/latest/)), build indices via annoy, and cache visual similarities via the annoy index.

```
make submit-embed-job
```

This will pull up resources and run the [primrose](https://github.com/ww-tech/primrose) configuration files necessary to pull your image data and create embeddings via a [tfhub](https://tfhub.dev/) model. Please note that all primrose jobs are orchestrated via yaml files, following primrose's
"configuration as code" philosophy. For this particular job, your correct bucket and project locations must be configured in `art_snob_primrose/config/image_embeddings_etl.yaml`

Next, we need to perform Umap on the image embeddings and store an [annoy index](https://github.com/spotify/annoy) for sub-linear lookups, and cache neighbors for each image via those lookups 
```
make submit-object-job
make submit-neighbor-job
```

Now you've got a Datastore table with all neighbor lookups, along with an annoy index for online similarity searches. We'd like to also include the ability to do index lookups based on tags (extracted from source HTML). For this we need a "reverse index", i.e. key entries that respond to object Ids. It's also convenient for recommender systems to have some form of entropy, i.e. random selections, to ensure a good random distribution these are precalculated via a "random id" set generation job.

```
make submit-reverse-index-job
make submit-random-job
```
Again -- all of the above jobs are run via a **highly** configurable primrose container, so you only need to edit the yaml files in `art_snob_primrose/config` to adjust to your own settings. 

5. We now have all the requisite data-layer infrastructure to run an art search engine. We're ready for the online infrastructure to serve this up to art-hungry consumers. First we need a backend api to run the indexing and ranking feed, do authentication, and support state-management for users. You can deploy this to app-engine via:

```
make deploy-backend
```

6. The web-app supports semantic search as well, which is powered by Clip embedding similarity between search queries and image data. That backend runs in its own resource since it's more RAM intensive than the indexing/ranking backend:

```
make deploy-image-api
```

7. Finally the web-app front end, a React app, can be deployed
```
make deploy-frontend 
```

And there you have it! A full art search engine built from scraping affiliate art websites. It can support millions of works of art with flexible auto-scaling infrastructure.
