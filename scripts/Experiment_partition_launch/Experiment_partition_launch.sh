#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

# Download corese if not already present
if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

online_status_source_catalog_url=https://raw.githubusercontent.com/Wimmics/IndeGx/endpoint_status/catalogs/catalog.latest-status.ttl
online_endpoint_catalog_query=online_endpoint_catalog_query.rq
online_endpoint_catalog_file=online_endpoint_catalog.trig

# Extract a catalog of the endpoint that have been online in the last hour
java -jar $corese_jar sparql -i $online_status_source_catalog_url -o $online_endpoint_catalog_file -q $online_endpoint_catalog_query -of trig

cp $online_endpoint_catalog_file ../../catalogs/$online_endpoint_catalog_file

# Partitioning the online catalog to bit size
cd ../catalog_partitioner
./script.sh ../../catalogs/$online_endpoint_catalog_file 20
rm ../../catalogs/$online_endpoint_catalog_file

cd ../..

for catalog in `ls catalogs/ | grep $online_endpoint_catalog_file*`; do
    echo "Treating $catalog"
    partition_config='{
    "pre": "file:///rules/MetaVocabularies/_pre_manifest.ttl",
    "manifest": "file:///input/generated_rules/_manifest.ttl",
    "post": "file:///rules/MetaVocabularies/_post_manifest.ttl",
    "catalog": "file:///catalogs/CATALOG",
    "defaultQueryTimeout": 300,
    "nbFetchRetries": 10,
    "millisecondsBetweenRetries": 5000,
    "maxConccurentQueries": 300,
    "delayMillisecondsTimeForConccurentQuery": 1000,
    "logFile": "/output/indegx_CATALOG.log",
    "outputFile": "/output/indegx_CATALOG.trig",
    "queryLog": true,
    "resilience": true
}'
    partition_config_filename="config/config_$catalog.json"
    echo $partition_config | sed -e s/CATALOG/$catalog/g > $partition_config_filename
    ./run.sh -c /$partition_config_filename

    rm $partition_config_filename
    rm $catalog
done

rm catalogs/$online_endpoint_catalog_file