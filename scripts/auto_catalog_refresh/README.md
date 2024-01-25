# Script to try to remotely refresh the endpoint catalog from remote catalogs


This script retrieves SPARQL endpoints urls from:
- [LOD Cloud](https://lod-cloud.net/lod-data.json), 
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Lists/SPARQL_endpoints), 
- [Linked Open Data](https://query.linkedopendata.eu/sparql), 
- [Openlink's list of endpoint](https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl), 
- [Yummy Data](https://yummydata.org/) 
- our [general](https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl) and our ["seredenpidity"](https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/crawling_catalog.ttl) catalogs from the [IndeGx](https://github.com/Wimmics/IndeGx) and [Metadatamatic](https://github.com/Wimmics/voidmatic) projects.

NOTICE: This script will be broken by very unusual endpoint URLs, such as <https://allegro.callisto.calmip.univ-toulouse.fr/#/repositories/sms>, with a `#` in the middle of the URL.
