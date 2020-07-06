# Art Snob infrastructure

## Art Snob scraping
Scraping is where we mine the raw data that we'll eventually mold into valuable recommendations for the users. Since 
we don't already have a large repository of artwork at our fingertips, we'll look to the internet to find the best
artwork among some popular sources.

### todo:

* set up GH actions file to do CI/CD
    - run tests
    - build image(s)
    - updates scraping crons from file

* auto_node capability to take in arbitrary types, pre-defined with combiner methods 
    - ex: All upstream lists with 10 elements (can define a type-check method in the type stub)