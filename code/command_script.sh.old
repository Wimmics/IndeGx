#!/bin/bash

ls input/*.ttl

# Start the corese server
for I in input/*;
do
    CatalogListARGS=${CatalogListARGS:+$CatalogListARGS;}$I
done

echo "java -jar corese/corese-server-4.3.0-jar-with-dependencies.jar -l $CatalogListARGS -su &"
java -jar corese/corese-server-4.3.0-jar-with-dependencies.jar -l $CatalogListARGS -su -debug &

sleep 5

# Start the IndeGx instances for each catalog
echo "java -jar indegx/kgindex.jar -catalogEndpoint http://localhost:8080/sparql -federation http://localhost:8080/sparql  -timeout 12000000 &"
java -jar indegx/kgindex.jar -catalogEndpoint http://localhost:8080/sparql -federation http://localhost:8080/sparql -output output/output.ttl -manifest https://raw.githubusercontent.com/Wimmics/dekalog/newRules/rules/extraction/asserted/manifest.ttl -timeout 12000000 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?