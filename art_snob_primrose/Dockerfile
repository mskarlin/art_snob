FROM python:3.8-buster

WORKDIR /usr/src/

COPY art_snob_primrose/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY art_snob_primrose/ ./

COPY utilities ./utilities/

CMD [ "python", "./run_primrose.py"]