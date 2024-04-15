# Script for the generation of tests for Indegx for the presence of each class and properties of an ontology

0. Clear rules folder
1. Extracts the list of classes and the list of properties of the ontologies in vocabularies folder
2. Generates a test for each class and property to check if it is present in an endpoint
3. Generates the manifest linking all the tests to add VANN based annotation int the index

# Usage

Add ontology files to the vocabularies folder

Launch the script
```bash
./script.sh
```

The generated rules will be added to the rules folder. Copy them in a folder accessible to IndeGx.

# Result extraction

## Count of endpoints where each class is used
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab ?elem (COUNT(DISTINCT ?endpointUrl) AS ?count) WHERE {
  ?elem a ?ontologyElementClass .
  VALUES ?ontologyElementClass { rdfs:Class owl:Class }
  FILTER(isIRI(?elem))
  OPTIONAL {
    ?elem voaf:usageInDataset ?occurrence .
    ?occurrence voaf:inDataset ?endpointUrl .
  }
    VALUES ?vocab { void: dcat: }
    FILTER( STRSTARTS( STR(?elem), STR(?vocab) ) ) 
} GROUP BY ?vocab ?elem
ORDER BY DESC(?count)
```

## List of endpoints where each class is used
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab ?elem ?endpointUrl WHERE {
  ?elem a ?ontologyElementClass .
  VALUES ?ontologyElementClass { rdfs:Class owl:Class}
  # VALUES ?ontologyElementClass { rdf:Property owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty owl:OntologyProperty }
  FILTER(isIRI(?elem))
  OPTIONAL {
    ?elem voaf:usageInDataset ?occurrence .
    ?occurrence voaf:inDataset ?endpointUrl .
  }
    VALUES ?vocab { void: dcat: }
    FILTER( STRSTARTS( STR(?elem), STR(?vocab) ) ) 
} GROUP BY ?vocab ?elem ?endpointUrl
```

## Count of endpoints where each property is used
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab ?elem (COUNT(DISTINCT ?endpointUrl) AS ?count) WHERE {
  ?elem a ?ontologyElementClass .
  VALUES ?ontologyElementClass { rdf:Property owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty owl:OntologyProperty }
  FILTER(isIRI(?elem))
  OPTIONAL {
    ?elem voaf:usageInDataset ?occurrence .
    ?occurrence voaf:inDataset ?endpointUrl .
  }
    VALUES ?vocab { void: dcat: }
    FILTER( STRSTARTS( STR(?elem), STR(?vocab) ) ) 
} GROUP BY ?vocab ?elem
ORDER BY DESC(?count)
```

## List of endpoints where each property is used
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?vocab ?elem ?endpointUrl WHERE {
  ?elem a ?ontologyElementClass .
  VALUES ?ontologyElementClass { rdf:Property owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty owl:OntologyProperty }
  FILTER(isIRI(?elem))
  OPTIONAL {
    ?elem voaf:usageInDataset ?occurrence .
    ?occurrence voaf:inDataset ?endpointUrl .
  }
    VALUES ?vocab { void: dcat: }
    FILTER( STRSTARTS( STR(?elem), STR(?vocab) ) ) 
} GROUP BY ?vocab ?elem ?endpointUrl
```
