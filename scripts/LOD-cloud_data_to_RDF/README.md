# Script for the conversion of LOD-cloud data to RDF

This script attemps to convert the data of the LOD cloud in JSON into an RDF catalog based on the DCAT vocabulary. The conversion uses several equivalent properties when possible to make the information redundant and easier to query.

The LOD cloud data used is the file available at [`https://lod-cloud.net/lod-data.json`](https://lod-cloud.net/lod-data.json).

The script is written in TypeScript and uses the [`rdflib.js`](https://github.com/linkeddata/rdflib.js) library to generate the RDF triples.

The quivalent properties used are taken from the [Metadatamatic project](https://github.com/Wimmics/voidmatic/blob/master/data/equivalences.ttl).