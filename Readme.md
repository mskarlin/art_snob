# Art Snob infrastructure

## Art Snob scraping
Scraping is where we mine the raw data that we'll eventually mold into valuable recommendations for the users. Since 
we don't already have a large repository of artwork at our fingertips, we'll look to the internet to find the best
artwork among some popular sources.

### todo:
* set up datastore call inside spider to shrink the number of things crawled
* set up docker image
* set up logging on the cloud 
* set up cloud func to launch an VM image template
* set up travis or GH actions file to do CI/CD
    - run tests
    - build image(s)
    - update/build out cloud funcs/VM templates/crons from config files

* test(s)