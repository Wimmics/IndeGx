# This image should contain a Corese server in sudo mode and the IndeGx application
# The default.json and the RDF files in the "input folder" should be used as catalogs by IndeGx and the resulting indexes should be saved in the "output" catalog
FROM ubuntu

ENV LANG C.UTF-8
RUN set -eux; \
    apt-get update; \
    apt-get install -f -y --no-install-recommends \
       bash sudo curl software-properties-common ca-certificates findutils coreutils gettext pwgen procps tini wget \
    ;

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - &&\
    apt-get install -f -y nodejs
RUN apt-get install -y aptitude
RUN aptitude install -y npm
RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

WORKDIR /indegx
COPY indegx/package.json package.json
RUN npm install

WORKDIR /
COPY . /

# Volume containing the catalogs
WORKDIR /input
VOLUME ["/input"]
#Volume containing the resulting indexes
WORKDIR /output
VOLUME ["/output"]
# Colume containing the configuration file
VOLUME ["/config"]

WORKDIR /indegx
RUN npm install
RUN npm run build

WORKDIR /
RUN chmod +x dockerStart.sh
CMD ./dockerStart.sh
