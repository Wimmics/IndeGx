#! /bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar
jq_version=1.7.1
jq_executable=jq-linux64

if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

if [ ! -e $jq_executable ]; then
    wget -q https://github.com/jqlang/jq/releases/download/jq-$jq_version/$jq_executable
    chmod +x $jq_executable
fi

generic_endpoint_query=generic_endpoint_construct.rq
dummy_dataset=dummy_dataset.ttl
published_catalog=../../catalogs/catalog.auto_refresh.ttl
tmp_query_file=tmp_query.rq
raw_final_file=catalog.raw.nt
echo "" > $raw_final_file

# <https://lod-cloud.net/lod-data.json>
echo "Treating remote LOD cloud file"
lod_json_file=https://lod-cloud.net/lod-data.json
tmp_local_lod_file=lod-data.json
tmp_lod_jsonld_file=lod-data.jsonld
tmp_lod_rdf_file=lod-data.trig
lod_output_file=lod_endpoints.rdf

curl -s -L $lod_json_file -o $tmp_local_lod_file 
cat $tmp_local_lod_file | ./$jq_executable '[ { "http://www.w3.org/ns/dcat#endpointURL": { "@id":to_entries.[].value.sparql.[].access_url } } ]' > $tmp_lod_jsonld_file
java -jar $corese_jar convert -i $tmp_lod_jsonld_file -if application/ld+json -o $tmp_lod_rdf_file -of trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$lod_json_file,g" $tmp_query_file
java -jar $corese_jar sparql -i $tmp_lod_rdf_file -o $lod_output_file -q $tmp_query_file -of rdf
echo "Remote LOD cloud file treated, `wc -l $lod_output_file` lines"

rm $tmp_query_file
rm $tmp_lod_jsonld_file
rm $tmp_local_lod_file
rm $tmp_lod_rdf_file

# <https://www.wikidata.org/wiki/Wikidata:Lists/SPARQL_endpoints>
echo "Treating remote Wikidata endpoint"
wikidata_query=wikidata_endpoint_construct.rq
wikidata_endpoint=https://query.wikidata.org/sparql
wikidata_output_file=wikidata_endpoints.rdf

cat $wikidata_query > $tmp_query_file
sed -i "s,SOURCE,$wikidata_endpoint,g" $tmp_query_file
java -jar $corese_jar remote-sparql -e $wikidata_endpoint -o $wikidata_output_file -q $tmp_query_file -a application/rdf+xml
echo "Remote Wikidata endpoint treated, `wc -l $wikidata_output_file` lines"

rm $tmp_query_file

# <https://query.linkedopendata.eu/sparql> 
echo "Treating remote Linked Open Data endpoint"
linkedopendata_query=linkedopendata_endpoint_construct.rq
linkedopendata_endpoint=https://query.linkedopendata.eu/sparql
linkedopendata_output_file=linkedopendata_endpoints.rdf

cat $linkedopendata_query > $tmp_query_file
sed -i "s,SOURCE,$linkedopendata_endpoint,g" $tmp_query_file
java -jar $corese_jar remote-sparql -e $linkedopendata_endpoint -o $linkedopendata_output_file -q $tmp_query_file -a application/rdf+xml
echo "Remote Linked Open Data endpoint treated, `wc -l $linkedopendata_output_file` lines"

rm $tmp_query_file

# <https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl> 
echo "Treating remote Openlink file"
openlink_file=https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl
openlink_output_file=openlink_endpoints.rdf

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$openlink_file,g" $tmp_query_file
java -jar $corese_jar sparql -i $openlink_file -o $openlink_output_file -q $tmp_query_file -of rdf
echo "Remote Openlink file treated, `wc -l $openlink_output_file` lines"

rm $tmp_query_file

# <https://yummydata.org/> 
######## No endpoint to query. Using jq to convert the Yummy data API file into JSON-LD, then Corese to convert it to TriG
echo "Treating remote Yummy API"
yummy_API=https://yummydata.org/api/endpoint/search
tmp_json_yummy_file=yummy_data.json
tmp_ttl_yummy_file=yummy_data.trig
yummy_output_file=yummy_endpoints.rdf

curl -s -L -H 'Accept: application/json' $yummy_API | ./$jq_executable '[ { "http://www.w3.org/ns/dcat#endpointURL": { "@id":.[].endpoint_url } } ]' > $tmp_json_yummy_file
java -jar $corese_jar convert -i $tmp_json_yummy_file -if application/ld+json -o $tmp_ttl_yummy_file -of trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$yummy_API,g" $tmp_query_file
java -jar $corese_jar sparql -i $tmp_ttl_yummy_file -o $yummy_output_file -q $tmp_query_file -of rdf
echo "Remote Yummy API treated, `wc -l $yummy_output_file` lines"

rm $tmp_query_file
rm $tmp_json_yummy_file
rm $tmp_ttl_yummy_file

# <https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl> 
echo "Treating remote IndeGx file"
indegx_file=https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl
indegx_output_file=indegx_endpoints.rdf

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$indegx_file,g" $tmp_query_file
java -jar $corese_jar sparql -i $indegx_file -o $indegx_output_file -q $tmp_query_file -of rdf
echo "Remote IndeGx file treated, `wc -l $indegx_output_file` lines"

rm $tmp_query_file

# <https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/crawling_catalog.ttl> 
echo "Treating remote IndeGx crawling file"
crawling_file=https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/crawling_catalog.ttl
crawling_output_file=crawling_endpoints.rdf

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$crawling_file,g" $tmp_query_file
java -jar $corese_jar sparql -i $crawling_file -o $crawling_output_file -q $tmp_query_file -of rdf
echo "Remote IndeGx file treated, `wc -l $crawling_output_file` lines"

rm $tmp_query_file

# <https://wimmics.github.io/voidmatic/>
####### Data must be obtained manually, added to the crawling_catalog.ttl file

# <https://data.europa.eu/sparql>
echo "Treating Europa endpoint"
europa_endpoint=https://data.europa.eu/sparql
europa_endpoints_query=europa_with_corese_loop_query.rq
europa_output_file=europa_endpoints.rdf

cat $europa_endpoints_query > $tmp_query_file
sed -i "s,SOURCE,$europa_endpoint,g" $tmp_query_file
java -jar $corese_jar sparql -i $dummy_dataset -o $europa_output_file -q $tmp_query_file -of rdf
echo "Europa endpoint treated, `wc -l $europa_output_file` lines"

rm $tmp_query_file

# Previous version of the catalog
if [ -e $published_catalog ]; then
    echo "Treating previous version of the catalog"
    published_catalog_url=https://github.com/Wimmics/IndeGx/raw/catalog_auto_refresh/catalogs/catalog.auto_refresh.ttl
    previous_catalog_output_file=previous_catalog_endpoints.rdf

    cat $generic_endpoint_query > $tmp_query_file
    sed -i "s,SOURCE,$published_catalog_url,g" $tmp_query_file

    java -jar $corese_jar sparql -i $published_catalog -o $previous_catalog_output_file -q $tmp_query_file -of rdf
    echo "Previous version of the catalog treated, `wc -l $previous_catalog_output_file` lines"

    rm $tmp_query_file
fi

# Concatenation of the resulting files
final_catalog_query=final_catalog_construct.rq
init_catalog_query=init_catalog_construct.rq
tmp_raw_init_catalog_file=init_catalog.rdf
final_raw_file=catalog.final.rdf
final_file=catalog.final.ttl

echo "Init of the catalog"
echo "java -jar $corese_jar sparql -i $dummy_dataset -o $tmp_raw_init_catalog_file -q $init_catalog_query -of rdf"
java -jar $corese_jar sparql -i $dummy_dataset -o $tmp_raw_init_catalog_file -q $init_catalog_query -of rdf
echo "java -jar $corese_jar sparql -i `ls | grep .rdf` -o $final_raw_file -q $final_catalog_query -of rdf"
java -jar $corese_jar sparql -i `ls | grep .rdf` -o $final_raw_file -q $final_catalog_query -of rdf
echo "java -jar $corese_jar convert -i $final_raw_file -r ttl -o $final_file"
java -jar $corese_jar convert -i $final_raw_file -r ttl -o $final_file
echo "Final catalog contains `wc -l $final_file` lines"

mv $final_file $published_catalog

rm $lod_output_file
rm $wikidata_output_file
rm $linkedopendata_output_file
rm $openlink_output_file
rm $yummy_output_file
rm $indegx_output_file
rm $crawling_output_file
rm $europa_output_file
if [ -e $previous_catalog_output_file ]; then
    rm $previous_catalog_output_file
fi
rm $tmp_raw_init_catalog_file
rm $final_raw_file