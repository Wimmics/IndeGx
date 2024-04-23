# Script for the generation of tests for Indegx for the presence of each class and properties of an ontology

0. Clear rules folder
1. Extracts the list of namespaces of the ontologies in LOV subset in the input folder
2. Generates a test for each namespace to check if it is present in an endpoint
3. Generates the manifest linking all the tests to add VANN based annotation int the index

# Usage

Add ontology files to the vocabularies folder

Launch the script
```bash
./script.sh
```

The generated rules will be added to the rules folder. Copy them in a folder accessible to IndeGx.

# Result extraction

## List of endpoints where each ontology is used

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab ?endpointUrl WHERE {
    ?vocab a owl:Ontology .
    FILTER(isIRI(?vocab))
    OPTIONAL {
        ?vocab voaf:usageInDataset ?occurrence .
        ?occurrence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?vocab ?endpointUrl
```

## Count of endpoints where each ontology is used

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab (COUNT(DISTINCT ?endpointUrl) AS ?count) WHERE {
    ?vocab a owl:Ontology .
    FILTER(isIRI(?vocab))
    OPTIONAL {
        ?vocab voaf:usageInDataset ?occurrence .
        ?occurrence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?vocab
ORDER BY DESC(?count)
```
