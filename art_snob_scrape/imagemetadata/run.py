from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

process = CrawlerProcess(get_project_settings())

# add a crawl for each crawler that we need
process.crawl('society6')
process.start()  # the script will block here until the crawling is finished
