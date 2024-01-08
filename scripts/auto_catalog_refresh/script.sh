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
tmp_query_file=tmp_query.rq
raw_final_file=catalog.raw.nt
echo "" > $raw_final_file

# <https://lod-cloud.net/lod-data.json>
echo "Treating remote LOD cloud file"
lod_json_file=https://lod-cloud.net/lod-data.json
tmp_local_lod_file=lod-data.json
tmp_lod_jsonld_file=lod-data.jsonld
tmp_lod_rdf_file=lod-data.ttl
lod_output_file=lod_endpoints.trig

echo "curl -s -L $lod_json_file -o $tmp_local_lod_file"
curl -s -L $lod_json_file -o $tmp_local_lod_file 
echo "cat $tmp_local_lod_file | ./$jq_executable '[ { \"http://www.w3.org/ns/dcat#endpointURL\": { \"@id\":to_entries.[].value.sparql.[].access_url } } ]' > $tmp_lod_jsonld_file"
cat $tmp_local_lod_file | ./$jq_executable '[ { "http://www.w3.org/ns/dcat#endpointURL": { "@id":to_entries.[].value.sparql.[].access_url } } ]' > $tmp_lod_jsonld_file
java -jar $corese_jar convert -i $tmp_lod_jsonld_file -if application/ld+json -o $tmp_lod_rdf_file -of trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$lod_json_file,g" $tmp_query_file
echo "java -jar $corese_jar sparql -i $tmp_lod_rdf_file -o $lod_output_file -q $tmp_query_file -of trig"
java -jar $corese_jar sparql -i $tmp_lod_rdf_file -o $lod_output_file -q $tmp_query_file -of trig
cat $lod_output_file >> $raw_final_file
echo "Local LOD cloud converted to RDF treated, `wc -l $lod_output_file` lines"
rm $lod_output_file
rm $tmp_query_file
rm $tmp_lod_jsonld_file
rm $tmp_local_lod_file
rm $tmp_lod_rdf_file

# <https://www.wikidata.org/wiki/Wikidata:Lists/SPARQL_endpoints>
echo "Treating remote Wikidata endpoint"
wikidata_query=wikidata_endpoint_construct.rq
wikidata_endpoint=https://query.wikidata.org/sparql
wikidata_output_file=wikidata_endpoints.nt

cat $wikidata_query > $tmp_query_file
sed -i "s,SOURCE,$wikidata_endpoint,g" $tmp_query_file
echo "java -jar $corese_jar remote-sparql -e $wikidata_endpoint -o $wikidata_output_file -q $tmp_query_file -a application/n-triples"
java -jar $corese_jar remote-sparql -e $wikidata_endpoint -o $wikidata_output_file -q $tmp_query_file -a application/n-triples
cat $wikidata_output_file >> $raw_final_file
echo "Remote Wikidata endpoint treated, `wc -l $wikidata_output_file` lines"
rm $wikidata_output_file
rm $tmp_query_file

# <https://query.linkedopendata.eu/index.html#%23title%3A%20SPARQL%20endpoints%20%0A%0ASELECT%20DISTINCT%20%3FEndpoint%20%3FEndpointLabel%20%3FURL%20%0A%7B%3FEndpoint%20wdt%3AP35%20wd%3AQ3287501%3B%0A%20%20%20%20%20%20%20%20%20%20%20wdt%3AP445%20%3FURL%20.%0A%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22%5BAUTO_LANGUAGE%5D%2Cen%22.%20%7D%0A%20%0A%20%7D%0AGROUP%20BY%20%3FURL%20%3FEndpointLabel%20%3FEndpoint%0AORDER%20BY%20DESC%28%3FTriples%29> 
echo "Treating remote Linked Open Data endpoint"
linkedopendata_query=linkedopendata_endpoint_construct.rq
linkedopendata_endpoint=https://query.linkedopendata.eu/sparql
linkedopendata_output_file=linkedopendata_endpoints.nt

cat $linkedopendata_query > $tmp_query_file
sed -i "s,SOURCE,$linkedopendata_endpoint,g" $tmp_query_file
echo "java -jar $corese_jar remote-sparql -e $linkedopendata_endpoint -o $linkedopendata_output_file -q $tmp_query_file -a application/n-triples"
java -jar $corese_jar remote-sparql -e $linkedopendata_endpoint -o $linkedopendata_output_file -q $tmp_query_file -a application/n-triples
cat $linkedopendata_output_file >> $raw_final_file
echo "Remote Linked Open Data endpoint treated, `wc -l $linkedopendata_output_file` lines"
rm $linkedopendata_output_file
rm $tmp_query_file

# <https://io.datascience-paris-saclay.fr/query/List_of_datasets_with_a_SPARQL_endpoint> 

# <https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl> 
echo "Treating remote Openlink file"
openlink_file=https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl
openlink_output_file=openlink_endpoints.trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$openlink_file,g" $tmp_query_file
echo "java -jar $corese_jar sparql -i $openlink_file -o $openlink_output_file -q $tmp_query_file -of trig"
java -jar $corese_jar sparql -i $openlink_file -o $openlink_output_file -q $tmp_query_file -of trig
cat $openlink_output_file >> $raw_final_file
echo "Remote Openlink file treated, `wc -l $openlink_output_file` lines"
rm $openlink_output_file
rm $tmp_query_file

# <https://yummydata.org/> 
######## No endpoint to query. Using jq to convert the Yummy data API file into JSON-LD, then Corese to convert it to TriG
echo "Treating remote Yummy API"
yummy_API=https://yummydata.org/api/endpoint/search
tmp_json_yummy_file=yummy_data.json
tmp_ttl_yummy_file=yummy_data.trig
yummy_output_file=yummy_endpoints.trig

curl -s -L -H 'Accept: application/json' $yummy_API | ./$jq_executable '[ { "http://www.w3.org/ns/dcat#endpointURL": { "@id":.[].endpoint_url } } ]' > $tmp_json_yummy_file
java -jar $corese_jar convert -i $tmp_json_yummy_file -if application/ld+json -o $tmp_ttl_yummy_file -of trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$yummy_API,g" $tmp_query_file
echo "java -jar $corese_jar sparql -i $tmp_ttl_yummy_file -o $yummy_output_file -q $tmp_query_file -of trig"
java -jar $corese_jar sparql -i $tmp_ttl_yummy_file -o $yummy_output_file -q $tmp_query_file -of trig
cat $yummy_output_file >> $raw_final_file
echo "Remote Yummy API treated, `wc -l $yummy_output_file` lines"
rm $yummy_output_file
rm $tmp_query_file
rm $tmp_json_yummy_file
rm $tmp_ttl_yummy_file

# <https://linkedwiki.com> 

# <https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl> 
echo "Treating remote IndeGx file"
indegx_file=https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl
indegx_output_file=indegx_endpoints.trig

cat $generic_endpoint_query > $tmp_query_file
sed -i "s,SOURCE,$indegx_file,g" $tmp_query_file
echo "java -jar $corese_jar sparql -i $indegx_file -o $indegx_output_file -q $tmp_query_file -of trig"
java -jar $corese_jar sparql -i $indegx_file -o $indegx_output_file -q $tmp_query_file -of trig
cat $indegx_output_file >> $raw_final_file
echo "Remote IndeGx file treated, `wc -l $indegx_output_file` lines"
rm $indegx_output_file
rm $tmp_query_file

# <https://wimmics.github.io/voidmatic/>
####### Data must be obtained manually, added to the IndeGx file

# <https://data.europa.eu/sparql>
######## Endpoints are not actual SPARQL endpoint

# Concatenation of the resulting files
final_file=catalog.final.trig

final_catalog_query=final_catalog_construct.rq
echo "Cumulated list of endpoints contains `wc -l $raw_final_file` lines"
echo "java -jar $corese_jar sparql -i $raw_final_file -o $final_file -q $final_catalog_query -of trig"
java -jar $corese_jar sparql -i $raw_final_file -o $final_file -q $final_catalog_query -of trig
rm $raw_final_file