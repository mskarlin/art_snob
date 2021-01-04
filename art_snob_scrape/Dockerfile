FROM python:3.8-buster

WORKDIR /usr/src/

COPY art_snob_scrape/requirements.txt ./
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY art_snob_scrape/imagemetadata/ ./

COPY utilities ./utilities/

CMD [ "python", "./run.py" ]