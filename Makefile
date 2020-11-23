SCRAPERNAME=scraper
PRIMROSENAME=primrose
CONTAINERLOC=gcr.io/artsnob-1/
JOBNAME=custom_container_job_$(shell date +%Y%m%d_%H%M%S)
REGION=us-east1

build-scrape:
	docker build -f art_snob_scrape/Dockerfile -t $(SCRAPERNAME) .
	docker tag $(SCRAPERNAME) $(CONTAINERLOC)$(SCRAPERNAME)
	docker push $(CONTAINERLOC)$(SCRAPERNAME)

build-primrose:
	docker build -f art_snob_primrose/Dockerfile -t $(PRIMROSENAME) .
	docker tag $(PRIMROSENAME) $(CONTAINERLOC)$(PRIMROSENAME)
	docker push $(CONTAINERLOC)$(PRIMROSENAME)

submit-embed-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-32 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/image_embeddings_etl.yaml --use_stackdriver_logging False --project artsnob-1

submit-random-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-8 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/create_random_selections.yaml --use_stackdriver_logging False --project artsnob-1

submit-reverse-index-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-8 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/create_tags_reverse_index.yaml --use_stackdriver_logging False --project artsnob-1

submit-neighbor-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-8 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/image_embedding_pca_index.yaml --use_stackdriver_logging False --project artsnob-1

submit-object-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-8 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/image_embeddings_get_objects.yaml --use_stackdriver_logging False --project artsnob-1

submit-scrape-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-4 \
		--master-image-uri gcr.io/artsnob-1/scraper \
		--region $(REGION) \
		--scale-tier CUSTOM

create-neo4j-db:
	docker run \
		--name testneo4j \
		-p7474:7474 -p7687:7687 \
		-d \
		-v $(HOME)/neo4j/data:/data \
		-v $(HOME)/neo4j/logs:/logs \
		-v $(HOME)/neo4j/import:/var/lib/neo4j/import \
		-v $(HOME)/neo4j/plugins:/plugins \
		--env NEO4J_AUTH=neo4j/test \
		neo4j:latest