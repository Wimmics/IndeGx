# IndeGx application

## Description

This repository hosts the new version of the IndeGx application. This new version will be a Typescript application interfaced with a Corese server instance, both encapsulated in a Docker image. The generation rules are rewritten to be more consistent in the form of SPARQL Update queries sent to the Corese server.

## IndeGx

IndeGx is a framework to created for the creation of an RDF knowledge graph that can be used as an index of knowledge graphs available online. It uses a set of rules to extract and compute the content of this index using SPARQL queries.

IndeGx is designed to make full use of existing semantic web standards and existing technologies. Any set of rules expressed with the correct vocabularies can be used to generate a knowledge graph.

### Differences with the previous version

Ths new version of IndeGx has advantages compared to the previous one in the DeKaLoG repository:

- The previous version was a java application coded with Apache Jena, this version uses an engine coded in Typescript with [rdflib](https://github.com/linkeddata/rdflib.js), [graphy](https://github.com/blake-regalia/graphy.js#readme), [sparqljs](https://github.com/RubenVerborgh/SPARQL.js#readme), coupled with a [Corese](https://corese.inria.fr/) Server, in a [docker](https://www.docker.com/get-started/) application.
- Treatment of endpoints in parallel
- The automatic pagination of simple queries to avoid to overwhelm SPARQL endpoints.
- The usage of Corese as an interface with SPARQL endpoints to reduce missing data due to errors coming from incorrect standard compliance in distant SPARQL endpoints.
  - Rules are now expected to make heavy use of federated querying, with the `SERVICE` clause.
- Possibility to define the application of several rules as a pre-requisite to the application of another.
- End of the difference between `CONSTRUCT` and `UPDATE` rules to differentiate between the application of local and distant queries. Only test queries are supposed to be `SELECT`, `ASK` or `CONSTRUCT`. All action queries are expected to be `UPDATE` queries.
- Possibility to define a set rules as post-treatment on the extracted data. In this case the endpoint URL becomes the url of the local corese server (not accessible from the outside of the docker)
- Integration of [LDscript](http://ns.inria.fr/sparql-extension/) in rules possible.

The index extraction rules have been modified as follows:

- The asserted and computed elements of a knowledge base description are now separated into different graphs. Each description now consists in 3 graphs for one KB. More details in [the rule folder](./rules/README.md).
- The extraction of a summary of datasets using the HiBisCus format: (\<hostname of subject\> \<property\> \<hostname of object, placeholder literal\>)
- The computation of statistics of the usage of vocabularies and on the usage of the hostnames of resources in the dataset.

## Execution

### Requirements

IndeGx requires to have git, docker compose installed on a Linux-based system.

### Installation

To use IndeGx, first clone this repository in a folder using :
`git clone https://github.com/Wimmics/IndeGx.git .`

### Commands

Compilation:
`./build.sh`

Execution:
`./run.sh`

### Configuration

The IndeGx application is configured by a config file in the `/config` folder.

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

### Future improvments

- The index extraction rules are continually updated with new features
- As soon as it is technologically sustainable, IndeGx will use the RDF Star standard

## Known issues

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
