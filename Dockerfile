# This image should contain a Corese server in sudo mode and the IndeGx application
# The default.json and the RDF files in the "input folder" should be used as catalogs by IndeGx and the resulting indexes should be saved in the "output" catalog
FROM ubuntu

ENV LANG C.UTF-8
RUN set -eux; \
    apt-get update; \
    apt-get install -f -y --no-install-recommends \
       bash sudo curl software-properties-common ca-certificates findutils coreutils gettext pwgen procps tini git default-jre wget \
    ;

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - &&\
    apt-get install -f -y nodejs
RUN apt-get install -y aptitude
RUN aptitude install -y npm
RUN npm install npm@latest -g && \
    npm install n -g && \
    n latest

WORKDIR /

WORKDIR /corese
RUN wget "https://github.com/Wimmics/corese/releases/download/release-4.4.0/corese-server-4.4.0.jar" -O /corese/corese-server-4.4.0.jar
RUN echo "DISABLE_OWL_AUTO_IMPORT = true" > corese-server.properties
RUN echo "LOAD_IN_DEFAULT_GRAPH = true" >> corese-server.properties


WORKDIR /indegx
RUN git clone https://github.com/Wimmics/IndeGx.git .


# Volume containing the catalogs
WORKDIR /input
VOLUME ["/input"]
#Volume containing the resulting indexes
WORKDIR /output
VOLUME ["/output"]

WORKDIR /indegx/code
RUN npm install
RUN npm run build


WORKDIR /indegx
RUN chmod +x dockerStart.sh
CMD ./dockerStart.sh
