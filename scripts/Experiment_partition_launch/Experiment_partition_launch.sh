#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

# Download corese if not already present
if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

if [ $# -ge 2 ]; then
    echo "Expected arguments: $0 <template configuration file (optional)>"
    exit 0
fi

local_path=$(pwd)
template_config=$local_path/template_config.json
if [ $# -eq 1 ]; then
    template_config=$local_path/$(basename $1)
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
    partition_config_filename="config/config_$catalog.json"
    cat $partition_config_filename
    cat $template_config | sed -e s/CATALOG/$catalog/g > $partition_config_filename
    
    ./run.sh -c /$partition_config_filename

    rm $partition_config_filename
    rm $catalog
done