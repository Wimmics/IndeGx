#!/bin/bash

virtuosoUploadFolder="/appli/virtuoso/virtuoso-opensource/upload/"
virtuosoInternatUploadFolder="upload"

cp import-rdf.isql $virtuosoUploadFolder

cd ../..

for catalog in `ls catalogs/ | grep all_catalog_partition_*`; do
    catalogOutput="$(pwd)/output/indegx_$catalog.trig"
    cp $catalogOutput $virtuosoUploadFolder
done

docker exec virtuoso isql -H localhost -U dba -P $VIRTUOSO_DBA_PWD exec="LOAD $virtuosoInternatUploadFolder/import-rdf.isql"