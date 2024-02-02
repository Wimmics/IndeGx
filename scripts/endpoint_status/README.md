# Linked Open Data and SPARQL Endpoints Observatory

This folder contains the script used by the automated service monitoring of SPARQL Endpoints on an hourly basis.
The results are published in the file [catalog.latest-status.ttl](https://github.com/Wimmics/IndeGx/blob/catalog_auto_refresh/catalogs/catalog.latest-status.ttl).
Many Linked Data clients can consume the data directly from [https://raw.githubusercontent.com/Wimmics/IndeGx/endpoint_status/catalogs/catalog.latest-status.ttl](https://raw.githubusercontent.com/Wimmics/IndeGx/endpoint_status/catalogs/catalog.latest-status.ttl)

### How Does It Work

There is [this git action](.github/workflows/main.yml) which invokes the following process every hour.

The script [update-status.sh](update-status.sh) first downloads [the latest automatic catalog of endpoints from the IndeGx framework](https://raw.githubusercontent.com/Wimmics/IndeGx/catalog_auto_refresh/catalogs/catalog.auto_refresh.trig), and then runs the SPARQL query in [status-check.sparql](status-check.sparql) on each endpoint URL.

The workflow runner is our [sparql-integrate command line tool](https://github.com/SmartDataAnalytics/Sparqlintegrate), built on [Apache Jena](https://jena.apache.org/), which simplifies the process of mashing-up RDF datasets and SPARQL queries.

### Is Service Monitoring using GitActions Permitted?

According to this answer to the question: [Yes](https://github.community/t5/GitHub-Actions/Is-it-permitted-to-do-Remote-Requests-for-Service-Monitoring/m-p/50071#M7696)

### How To Contribute...

#### ... New Endpoints?

This project uses
[IndeGx's SPARQL endpoint dataset](https://raw.githubusercontent.com/Wimmics/IndeGx/catalog_auto_refresh/catalogs/catalog.auto_refresh.trig) as the source, which itself retrieve endpoints from different sources. In this repository, the "[`crawling_catalog.ttl`](https://github.com/Wimmics/IndeGx/blob/main/catalogs/crawling_catalog.ttl)" is used to manually add new endpoints. Please make pull requests to modify this file if you wish to add new endpoints.

#### ... Additional Service Information?

As github has API limits (1000 requests per hour) it may be better to make separate projects for other kind of information, such as void descriptions. Note, that one can use this service status dataset as the basis in order to not waste requests!

### Origin

This script and its associated Github actions are inspired of the original [LODservatory](https://github.com/SmartDataAnalytics/lodservatory) by SmartDataAnalytics. It has been heavily modified to use [corese-command](https://github.com/Wimmics/corese/tree/master#corese-command) and the resources of the IndeGx framework.


