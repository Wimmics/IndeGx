#! /bin/bash

corese_version=4.5.0
corese_jar=corese-command-$corese_version.jar

if [ ! -e $corese_jar ]; then
    wget -q https://github.com/Wimmics/corese/releases/download/release-$corese_version/$corese_jar
fi

generic_endpoint_query=generic_endpoint_construct.rq
raw_final_file=catalog.raw.nt
echo "" > $raw_final_file

# <https://lod-cloud.net/>
echo "Treating local LOD cloud converted to RDF"
lod_file=../LOD-cloud_data_to_RDF/lod-data.ttl
lod_output_file=lod_endpoints.trig

echo "java -jar $corese_jar sparql -i $lod_file -o $lod_output_file -q $generic_endpoint_query -of trig"
java -jar $corese_jar sparql -i $lod_file -o $lod_output_file -q $generic_endpoint_query -of trig
cat $lod_output_file >> $raw_final_file
echo "Local LOD cloud converted to RDF treated, `wc -l $lod_output_file` lines"
rm $lod_output_file

# <https://www.wikidata.org/wiki/Wikidata:Lists/SPARQL_endpoints>
echo "Treating remote Wikidata endpoint"
wikidata_query=wikidata_endpoint_construct.rq
wikidata_endpoint=https://query.wikidata.org/sparql
wikidata_output_file=wikidata_endpoints.nt

echo "java -jar $corese_jar remote-sparql -e $wikidata_endpoint -o $wikidata_output_file -q $wikidata_query -a application/n-triples"
java -jar $corese_jar remote-sparql -e $wikidata_endpoint -o $wikidata_output_file -q $wikidata_query -a application/n-triples
cat $wikidata_output_file >> $raw_final_file
echo "Remote Wikidata endpoint treated, `wc -l $wikidata_output_file` lines"
rm $wikidata_output_file

# <https://query.linkedopendata.eu/index.html#%23title%3A%20SPARQL%20endpoints%20%0A%0ASELECT%20DISTINCT%20%3FEndpoint%20%3FEndpointLabel%20%3FURL%20%0A%7B%3FEndpoint%20wdt%3AP35%20wd%3AQ3287501%3B%0A%20%20%20%20%20%20%20%20%20%20%20wdt%3AP445%20%3FURL%20.%0A%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22%5BAUTO_LANGUAGE%5D%2Cen%22.%20%7D%0A%20%0A%20%7D%0AGROUP%20BY%20%3FURL%20%3FEndpointLabel%20%3FEndpoint%0AORDER%20BY%20DESC%28%3FTriples%29> 
echo "Treating remote Linked Open Data endpoint"
linkedopendata_query=linkedopendata_endpoint_construct.rq
linkedopendata_endpoint=https://query.linkedopendata.eu/sparql
linkedopendata_output_file=linkedopendata_endpoints.nt

echo "java -jar $corese_jar remote-sparql -e $linkedopendata_endpoint -o $linkedopendata_output_file -q $linkedopendata_query -a application/n-triples"
java -jar $corese_jar remote-sparql -e $linkedopendata_endpoint -o $linkedopendata_output_file -q $linkedopendata_query -a application/n-triples
cat $linkedopendata_output_file >> $raw_final_file
echo "Remote Linked Open Data endpoint treated, `wc -l $linkedopendata_output_file` lines"
rm $linkedopendata_output_file

# <https://io.datascience-paris-saclay.fr/query/List_of_datasets_with_a_SPARQL_endpoint> 

# <https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl> 
echo "Treating remote Openlink file"
openlink_file=https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl
openlink_output_file=openlink_endpoints.trig

echo "java -jar $corese_jar sparql -i $openlink_file -o $openlink_output_file -q $generic_endpoint_query -of trig"
java -jar $corese_jar sparql -i $openlink_file -o $openlink_output_file -q $generic_endpoint_query -of trig
cat $openlink_output_file >> $raw_final_file
echo "Remote Openlink file treated, `wc -l $openlink_output_file` lines"
rm $openlink_output_file

# <https://yummydata.org/> 

# <https://linkedwiki.com> 

# <../../catalogs/all_catalog_edited.ttl> 
echo "Treating remote IndeGx file"
indegx_file=../../catalogs/all_catalog_edited.ttl
indegx_output_file=indegx_endpoints.trig

echo "java -jar $corese_jar sparql -i $indegx_file -o $indegx_output_file -q $generic_endpoint_query -of trig"
java -jar $corese_jar sparql -i $indegx_file -o $indegx_output_file -q $generic_endpoint_query -of trig
cat $indegx_output_file >> $raw_final_file
echo "Remote IndeGx file treated, `wc -l $indegx_output_file` lines"
rm $indegx_output_file

# <https://wimmics.github.io/voidmatic/>

# <https://data.europa.eu/sparql>
# data_europa_endpoint=https://data.europa.eu/sparql
# data_europa_output_file=data_europa_endpoints.nt

# echo "java -jar $corese_jar remote-sparql -e $data_europa_endpoint -o $data_europa_output_file -q $generic_endpoint_query -a application/n-triples"
# java -jar $corese_jar remote-sparql -e $data_europa_endpoint -o $data_europa_output_file -q $generic_endpoint_query -a application/n-triples
# cat $data_europa_output_file >> $raw_final_file
# echo "Remote Linked Open Data endpoint treated, `wc -l $data_europa_output_file` lines"
######## Endpoints are not actual SPARQL endpoint

# Concatenation of the resulting files
final_file=catalog.final.trig

final_catalog_query=final_catalog_construct.rq
echo "Cumulated list of endpoints contains `wc -l $raw_final_file` lines"
echo "java -jar $corese_jar sparql -i $raw_final_file -o $final_file -q $final_catalog_query -of trig"
java -jar $corese_jar sparql -i $raw_final_file -o $final_file -q $final_catalog_query -of trig
rm $raw_final_file