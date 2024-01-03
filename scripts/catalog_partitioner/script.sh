#!/bin/bash

# Uses corese-command to extract slices of the catalog. Endpoints must be linked to their URLs using the void:sparqlEndpoint predicate.

if [ $# -lt 1 ] || [ $# -ge 3 ]; then
    echo "Usage: $0 <catalog> [slice-size]"
    exit 1
fi

catalog=$1

slice_size=50
if [ $# -eq 2 ]; then
    slice_size=$2
fi

max_number_of_endpoint=`grep -o -i sparqlEndpoint $catalog | wc -l`

partition_start=0
partition_end=$slice_size
while [ $partition_start -lt $max_number_of_endpoint ]; do
    echo "Partition $partition_start to $partition_end"
    cat partition_construct.rq > partition_construct_edited.rq
    echo "LIMIT $slice_size" >> partition_construct_edited.rq
    echo "OFFSET $partition_start" >> partition_construct_edited.rq
    corese-command sparql -i $1 -o=$1-partition_$partition_start-$partition_end.ttl -q=./partition_construct_edited.rq -of=turtle
    partition_start=$((partition_start + slice_size))
    partition_end=$((partition_end + slice_size))
    rm partition_construct_edited.rq
done