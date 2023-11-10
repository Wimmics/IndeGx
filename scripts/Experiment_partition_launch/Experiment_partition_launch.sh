#!/bin/bash

cd ../..

for catalog in `ls catalogs/ | grep all_catalog_partition_*`; do
    echo $catalog
    partition_config='{
    "pre": "file:///rules/vocabulary_statistics/_pre_manifest.ttl",
    "manifest": "file:///rules/vocabulary_statistics/_manifest.ttl",
    "post": "file:///rules/vocabulary_statistics/_post_manifest.ttl",
    "catalog": "file:///catalogs/CATALOG",
    "defaultQueryTimeout": 300,
    "nbFetchRetries": 10,
    "millisecondsBetweenRetries": 5000,
    "maxConccurentQueries": 300,
    "delayMillisecondsTimeForConccurentQuery": 1000,
    "logFile": "/output/indegx_CATALOG.log",
    "outputFile": "/output/indegx_CATALOG.trig",
    "queryLog": true,
    "resilience": false
}'
    partition_config_filename="/config/config_$catalog.json"
    echo $partition_config | sed -e s/CATALOG/$catalog/g > $partition_config_filename
    echo "./run.sh -c $partition_config_filename"
done

