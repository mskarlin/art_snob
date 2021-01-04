from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
import sys
sys.path.append('../')
sys.path.append('../../')

from utilities.credentials import set_application_default_credentials
from utilities.custom_logging import setup_logging

setup_logging()

set_application_default_credentials()

process = CrawlerProcess(get_project_settings())

# add a crawl for each crawler that we need
process.crawl('society6')
process.start()  # the script will block here until the crawling is finished
