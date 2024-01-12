# IndeGx application

## Description

This repository hosts the new version of the IndeGx application. This new version will be a Typescript application interfaced with a Corese server instance, both encapsulated in a Docker image. The generation rules are rewritten to be more consistent in the form of SPARQL Update queries sent to the Corese server.

## IndeGx

IndeGx is a framework created for the creation of an RDF knowledge graph that can be used as an index of knowledge graphs available online. It uses a set of rules to extract and compute the content of this index using SPARQL queries.

IndeGx is designed to make full use of semantic web standards. Any rules expressed with a standard SPARQL syntax can be used to generate a knowledge graph.

### Differences with the previous version

This new version of IndeGx has advantages compared to the previous one in the DeKaLoG repository:

- The [previous version](https://github.com/Wimmics/dekalog) was a Java application coded with Apache Jena, this version uses an engine coded in Typescript with [rdflib](https://github.com/linkeddata/rdflib.js), [graphy](https://github.com/blake-regalia/graphy.js#readme), [sparqljs](https://github.com/RubenVerborgh/SPARQL.js#readme), coupled with a [Corese](https://corese.inria.fr/) Server, in a [docker](https://www.docker.com/get-started/) application.
- Treatment of endpoints in parallel
- The automatic pagination of simple queries to avoid overwhelming SPARQL endpoints.
- The usage of Corese as an interface with SPARQL endpoints to reduce missing data due to errors coming from incorrect standard compliance in distant SPARQL endpoints.
  - Rules are now expected to make heavy use of federated querying, with the `SERVICE` clause.
- Possibility to define the application of several rules as a prerequisite to the application of another.
- End of the difference between `CONSTRUCT` and `UPDATE` rules to differentiate between the application of local and distant queries. Only test queries are supposed to be `SELECT`, `ASK`, or `CONSTRUCT`. All action queries are expected to be `UPDATE` queries.
- Possibility to define a set of rules as post-treatment on the extracted data. In this case, the endpoint URL becomes the URL of the local corese server (not accessible from the outside of the docker)
- Integration of [LDscript](http://ns.inria.fr/sparql-extension/) in rules possible.

The index extraction rules have been modified as follows:

- A knowledge base description's asserted and computed elements are now separated into different graphs. Each description now consists of 3 graphs for one KB. More details are in [the rule folder](./rules/README.md).
- The extraction of a summary of datasets using the HiBisCus format: (\<hostname of subject\> \<property\> \<hostname of object, placeholder literal\>)
- The computation of statistics of the usage of vocabularies and the usage of the hostnames of resources in the dataset.

## Execution

IndeGx as an application is executed in a docker container. It contains the IndeGx engine, anda Corese server. The Corese server is used both to execute the rules against remote SPARQL endpoints and to store the results of the rules application. The Corese server is not accessible from outside the docker container.

### Requirements

IndeGx requires git, and docker-compose installed on a Linux-based system.

### Installation

To use IndeGx, first clone this repository in a folder using :
```
git clone https://github.com/Wimmics/IndeGx.git .
```

### Commands

Execution:
```
./run.sh
```

## Resources

Two catalogs of endpoints are maintained in this repository:
- The [catalog of endpoints](https://github.com/Wimmics/IndeGx/blob/catalog_auto_refresh/catalogs/catalog.auto_refresh.ttl), used in the [IndeGx paper](https://hal.science/hal-03946680) and updated every day from several online sources. The list of sources and the script used to generate the catalog are available in a dedicated [script folder](./scripts/auto_catalog_refresh/README.md).
- The [catalog of the status of endpoint](https://github.com/Wimmics/IndeGx/blob/endpoint_status/catalogs/catalog.latest-status.ttl) is based on the catalog of endpoint and is updated every hour to indicate if an endpoint is online or not. The script is detailed in a dedicated [script folder](./scripts/endpoint_status/README.md).

## Directories

There are 7 directories in this repository:
- `catalog`: contains catalogs of SPARQL endpoints as RDF files. Catalogs are expected to be writtent using the [DCAT vocabulary](https://www.w3.org/TR/vocab-dcat-2/). They will be available from the inside of the inside of the docker container from `/catalog/`.
- `config`: contains configuration for both IndeGx and its Corese server. They will be available from the inside of the inside of the docker container from `/config/`. More details in the [configuration section](#configuration).
- `indegx`: contains the code of the IndeGx engine.
- `input`: should contain the input files for the current rules. They will be available from the inside of the docker container from `/input/`.
- `output`: will contain the output files of the execution of IndeGx. They will contain the logs from the IndeGx engine and from the Corese server. They will also contain the result of the application of the rules, in the from of a TriG file. They will be available from the inside of the docker container from `/output/`.
- `rules`: contains the rules for the extraction of the index. They will be available from the inside of the docker container from `/rules/`. More details in the [rules section](#rules).
- `scripts`: contains scripts used in the different experiments done as part of the development and publications of IndeGx.

At the execution of `run.sh`, the content of the `indegx` folder will be copied to the docker container. The `catalog`, `config`, `input`, `output`, and `rules` folders will be mounted as volumes in the docker container. The `scripts` folder will not be copied nor mounted.

## Configuration

#### IndeGx configuration

The IndeGx application is configured by a config file in the `/config` folder. By default, the application will use the `default.json` file. The config file is a JSON file with the following structure:

```json
{
    "manifest": "file:///input/_manifest.ttl",
    "post": "file:///input/_post_manifest.ttl",
    "catalog": "file:///input/catalog.ttl",
    "defaultQueryTimeout": 300,
    "nbFetchRetries": 10,
    "millisecondsBetweenRetries": 5000,
    "maxConccurentQueries": 300,
    "delayMillisecondsTimeForConccurentQuery": 1000,
    "logFile": "/output/indegx.log",
    "outputFile": "/output/index.trig"
}
```

The structure of the config file is the following:
```typescript
{
    manifest: string, // Path to the main manifest file. It must be in one of the mounted volumes. It must be a valid RDF file. It is recomanded to store it in either the input or the rules folder.
    catalog: string, // Path to the catalog file. It must be in one of the mounted volumes. It must be a valid RDF file. It is recomanded to store it in the input
    post?: string, // Path to the post manifest file. It must be in one of the mounted volumes. It must be a valid RDF file. It is recomanded to store it in either the input or the rules folder.
    pre?: string, // Path to the pre manifest file. It must be in one of the mounted volumes. It must be a valid RDF file. It is recomanded to store it in either the input or the rules folder.
    nbFetchRetries?: number, // Default 10, number of retries to fetch a remote file if it fails.
    millisecondsBetweenRetries?: number, // Default 5000, number of milliseconds to wait between two retries.
    maxConccurentQueries?: number, // Default 300, maximum number of concurrent queries to execute against a SPARQL endpoint.
    delayMillisecondsTimeForConccurentQuery?: number, // Default 1000, number of milliseconds to wait between two queries against a SPARQL endpoint.
    defaultQueryTimeout?: number, // Default 60000, number of seconds to wait for a query to execute before considering it as a failure.
    logFile?: string, // Default /output/indegx.log, path to the log file. It must be in one of the mounted volumes.
    outputFile?: string, // Default /output/index.trig, path to the output file. It must be in one of the mounted volumes.
    manifestJSON?: string, // Path to the manifest file in JSON format. It must be in one of the mounted volumes. Will not be generated if not provided.
    postManifestJSON?: string, // Path to the post manifest file in JSON format. It must be in one of the mounted volumes. Will not be generated if not provided.
    queryLog?: boolean, // Default true, log queries in the index if true. 
    resilience?: boolean, // default false, store the result of the current state at the end of the pre step and main step of the index in a temporary file if true. Incompatible with disabling query logging.
}
```

#### Corese configuration

The Corese server in configured by the `corese-properties.properties` file, in the `/config` folder. It is a standard Corese configuration file. More information can be found on the [Corese documentation](https://github.com/Wimmics/corese/blob/master/docs/getting%20started/Getting%20Started%20With%20Corese-server.md).


## Rules

The `rules` contains several sets of rules used in different use cases during the development of IndeGx. The declaration of the rules is done using the [IndeGx vocabulary](./indegx_vocabulary.md) and the W3C manifest vocabulary (see [the rules folder](./rules/README.md) for more details).

## Future improvements

- The index extraction rules are continually updated with new features
- As soon as it is technologically sustainable, IndeGx will use the RDF Star standard

## Known issues

- Despite the pagination mechanism and iterative application of rules, it is possible that the extraction of data by IndeGx from a SPARQL endpoint overwhelms the capacities of the endpoint. Careful rule writing may reduce this problem. Yet, there is no way to guarantee that any rule may be successfully applied to any endpoint.
- Some HTTPS endpoints may raise SSL errors when interrogated. IndeGx relies on a Corese server to mitigate those errors. If the Corese server raises an SSL error during the application of a test, IndeGx considers this test as a failure.

## To cite this work

```bibtex
@article{maillot2023indegx,
  TITLE = {{IndeGx: A Model and a Framework for Indexing RDF Knowledge Graphs with SPARQL-based Test Suits}},
  AUTHOR = {Maillot, Pierre and Corby, Olivier and Faron, Catherine and Gandon, Fabien and Michel, Franck},
  URL = {https://hal.science/hal-03946680},
  JOURNAL = {{Journal of Web Semantics}},
  PUBLISHER = {{Elsevier}},
  YEAR = {2023},
  MONTH = Jan,
  DOI = {10.1016/j.websem.2023.100775},
  KEYWORDS = {semantic index ; metadata extraction ; dataset description ; endpoint description ; knowledge graph},
  PDF = {https://hal.science/hal-03946680/file/_DeKaloG__IndeGx___Web_Semantics_2022-1.pdf}
}
```
