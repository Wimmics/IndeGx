# syntax=docker/dockerfile:1

# This image should contain a Corese server un sudo mode and the IndeGx application
# The RDF files in the "input folder" should be used as catalogs by IndeGx and the resulting indexes should be saved in the "output" catalog
FROM ubuntu

ENV LANG C.UTF-8
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
       bash curl ca-certificates findutils coreutils gettext pwgen procps tini default-jre \
    ;

WORKDIR /

RUN mkdir corese
COPY corese-server-4.3.0-jar-with-dependencies.jar /corese

RUN mkdir indegx
COPY kgindex.jar /indegx

# Volume containing the catalogs
VOLUME ["/input"]
#Volume containing the resulting indexes
VOLUME ["/output"]

COPY command_script.sh /
RUN chmod +x command_script.sh
CMD ./command_script.sh

