# Art Snob infrastructure

## Art Snob scraping
Scraping is where we mine the raw data that we'll eventually mold into valuable recommendations for the users. Since 
we don't already have a large repository of artwork at our fingertips, we'll look to the internet to find the best
artwork among some popular sources.

### todo:
* finish up datastore writer (sync and todo for async)
* add annoy index builder
* test with local subset of data
* build and deploy job docker image via ai
* set up GH actions file to do CI/CD
    - run tests
    - build image(s)
    - updates scraping crons from file

* test(s)