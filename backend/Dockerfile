
FROM python:3.12

ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./app ./app