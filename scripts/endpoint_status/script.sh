#!/bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

# Download corese if not already present
if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

original_catalog=https://raw.githubusercontent.com/Wimmics/IndeGx/catalog_auto_refresh/catalogs/catalog.auto_refresh.trig
raw_catalog=catalog.raw.latest-status.trig
initial_catalog=initial_catalog.trig # Each named graph is a separate endpoint
tmp_final_catalog=final_catalog.tmp.ttl
final_catalog=../../catalogs/catalog.latest-status.ttl
previous_filtered_catalog=catalog.filtered.latest-status.ttl
prep_query=prep_query.rq
status_check_query=status_check.rq
remove_status_from_previous_catalog_query=construct_status_catalog_without_status.rq
final_query=construct_final_catalog.rq

# Map each endpoint to its own named graph,
java -jar $corese_jar sparql -i $original_catalog -q $prep_query -o $initial_catalog -of trig
echo "Starting with basic catalog: `wc -l $initial_catalog`"

# run the status check for each named graph
java -jar $corese_jar sparql -i $initial_catalog -q $status_check_query -o $raw_catalog -of trig
echo "Catalog with statuses: `wc -l $raw_catalog`"

if [ ! -e $final_catalog ]; then
    java -jar $corese_jar sparql -i $raw_catalog -q $final_query -o $tmp_final_catalog -of trig
else
    # Remove the status from the previous catalog
    java -jar $corese_jar sparql -i $final_catalog -q $remove_status_from_previous_catalog_query -o $previous_filtered_catalog -of ttl

    # Create final result from the new results and the previous catalog
    java -jar $corese_jar sparql -i $previous_filtered_catalog $raw_catalog -q $final_query -o $tmp_final_catalog -of ttl
fi
echo "Final catalog: `wc -l $tmp_final_catalog`"

mv $tmp_final_catalog $final_catalog

rm $raw_catalog
rm $initial_catalog
rm $previous_filtered_catalog
