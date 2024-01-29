# Linked Open Data and SPARQL Endpoints Observatory

This folder contains the script used by the automated service monitoring of SPARQL Endpoints on an hourly basis.
The results are published in the file [catalog.latest-status.ttl](https://github.com/Wimmics/IndeGx/blob/catalog_auto_refresh/catalogs/catalog.latest-status.ttl).
Many Linked Data clients can consume the data directly from [https://raw.githubusercontent.com/Wimmics/IndeGx/endpoint_status/catalogs/catalog.latest-status.ttl](https://raw.githubusercontent.com/Wimmics/IndeGx/endpoint_status/catalogs/catalog.latest-status.ttl)

### How Does It Work

There is [this git action](.github/workflows/catalog_status_action.yml) which invokes the following process every hour.

The script [script.sh](script.sh) first downloads [the latest automatic catalog of endpoints updated daily](https://github.com/Wimmics/IndeGx/blob/endpoint_status/scripts/auto_catalog_refresh/README.md), and then runs the SPARQL query in [status-check.rq](status-check.rq) on each endpoint URL.

The workflow runner is [corese-command](https://github.com/Wimmics/corese/tree/master#corese-command) which allows us to easily query RDF files, and SPARQL endpoints, and to make federated queries.

### Is Service Monitoring using GitActions Permitted?

According to this answer to the question: [Yes](https://github.community/t5/GitHub-Actions/Is-it-permitted-to-do-Remote-Requests-for-Service-Monitoring/m-p/50071#M7696)

### How To Contribute...

#### ... New Endpoints?

This project uses:
- [LOD Cloud](https://lod-cloud.net/lod-data.json), 
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Lists/SPARQL_endpoints), 
- [Linked Open Data](https://query.linkedopendata.eu/sparql), 
- [Openlink's list of endpoint](https://raw.githubusercontent.com/OpenLinkSoftware/general-turtle-doc-collection/master/LODCloud_SPARQL_Endpoints.ttl), 
- [Yummy Data](https://yummydata.org/) 
- our [general](https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/all_catalog_edited.ttl) and our ["serendipity"](https://raw.githubusercontent.com/Wimmics/IndeGx/main/catalogs/crawling_catalog.ttl) catalogs from the [IndeGx](https://github.com/Wimmics/IndeGx) and [Metadatamatic](https://github.com/Wimmics/voidmatic) projects

as sources, which themselves retrieve endpoints from different sources. In this repository, the "[`crawling_catalog.ttl`](https://github.com/Wimmics/IndeGx/blob/main/catalogs/crawling_catalog.ttl)" is used to manually add new endpoints. Please make pull requests to modify this file if you wish to add new endpoints.

#### ... Additional Service Information?

As GitHub has API limits (1000 requests per hour) it may be better to make separate projects for other kinds of information, such as void descriptions. Note, that one can use this service status dataset as the basis in order to not waste requests!

### Origin

This script and its associated Github actions are inspired by the original [LODservatory](https://github.com/SmartDataAnalytics/lodservatory) by SmartDataAnalytics. It has been redone to use [corese-command](https://github.com/Wimmics/corese/tree/master#corese-command) and the resources of the IndeGx framework.


