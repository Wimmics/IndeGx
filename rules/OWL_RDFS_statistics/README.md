# RDFS and OWL usage Statistics rules

This folder contains the generation assets used to extract statistics on the usage of known vocabularies in datasets

## Results

### Classes

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
    ?classrdfs:isDefinedBy ?vocab ;
        voaf:usageInDataset ?occurence .
    ?occurence voaf:inDataset ?endpointUrl .
} GROUP BY ?class
```

### Properties

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