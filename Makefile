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

submit-ai-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-4 \
		--master-image-uri $(CONTAINERLOC)$(PRIMROSENAME) \
		--region $(REGION) \
		--scale-tier CUSTOM \
		-- python run_primrose.py --config_loc config/image_embeddings_etl.yaml --use_stackdriver_logging True --project artsnob-1