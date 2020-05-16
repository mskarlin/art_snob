CONTAINER=gcr.io/artsnob-1/scraper
JOBNAME=custom_container_job_$(shell date +%Y%m%d_%H%M%S)
REGION=us-east1

build-scrape:
	docker build -f art_snob_scrape/Dockerfile .

submit-ai-job:
	gcloud ai-platform jobs submit training $(JOBNAME) \
		--master-machine-type n1-standard-4 \
		--master-image-uri $(CONTAINER) \
		--region $(REGION) \
		--scale-tier CUSTOM
