# RDFS and OWL usage Statistics rules

This folder contains the generation assets used to extract statistics on the usage of known vocabularies in datasets

## Number of active endpoints during indexing

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
SELECT (COUNT(DISTINCT ?url) AS ?endpointCount) {
  GRAPH ?url {
  	?url void:sparqlEndpoint ?url .
  }
}
```

## Results

### Classes and number of endpoints where they are used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?class ?count {
    { ?class a owl:Class }
    UNION { ?class a rdfs:Class }
    ?class rdfs:isDefinedBy ?vocab ;
        voaf:reusedByDatasets ?count .
} GROUP BY ?vocab ?class ?count
```

#### List of endpoints where each class is used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?class ?endpointUrl {
    { ?class a owl:Class }
    UNION { ?class a rdfs:Class }
    ?class rdfs:isDefinedBy ?vocab ;
        voaf:usageInDataset ?occurence .
    ?occurence voaf:inDataset ?endpointUrl .
} GROUP BY ?vocab ?class ?endpointUrl
```

### Properties and number of endpoints where they are used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?property ?count {
  { ?property a rdf:Property }
  UNION { ?property a owl:ObjectProperty }
  UNION { ?property a owl:DatatypeProperty }
  UNION { ?property a owl:AnnotationProperty }
  UNION{ ?property a owl:OntologyProperty }
    ?property voaf:reusedByDatasets ?count ;
    	rdfs:isDefinedBy ?vocab .
} GROUP BY ?vocab ?property ?count
```

#### List of endpoints where each property is used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?property ?endpointUrl {
    { ?property a rdf:Property }
    UNION { ?property a owl:ObjectProperty }
    UNION { ?property a owl:DatatypeProperty }
    UNION { ?property a owl:AnnotationProperty }
    UNION{ ?property a owl:OntologyProperty }
    ?property rdfs:isDefinedBy ?vocab ;
        voaf:usageInDataset ?occurence .
    ?occurence voaf:inDataset ?endpointUrl .
} GROUP BY ?vocab ?property ?endpointUrl
```

### Vocabularies and number of endpoints where they are used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?count {
    ?vocab vann:preferredNamespaceUri ?vocabURI ;
        voaf:reusedByDatasets ?count.
} GROUP BY ?vocab ?count
```

#### List of endpoints where each property is used

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?endpointUrl {
    ?vocab vann:preferredNamespaceUri ?vocabURI ;
    ?vocab rdfs:isDefinedBy ?vocab ;
        voaf:usageInDataset ?occurence .
    ?occurence voaf:inDataset ?endpointUrl .
} GROUP BY ?vocab ?endpointUrl
```