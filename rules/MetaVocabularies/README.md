# Meta-vocabularies usage statistics rules

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
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?class (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    {
        { ?class a owl:Class }
        UNION { ?class a rdfs:Class }
    } UNION {
        GRAPH ?vocab {
            { ?class a owl:Class }
            UNION { ?class a rdfs:Class }
        }
    }
    OPTIONAL {
        ?class rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
    FILTER(isIRI(?class))
} GROUP BY ?vocab ?class
```

#### List of endpoints where each class is used

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?class ?endpointUrl {
    {
        { ?class a owl:Class }
        UNION { ?class a rdfs:Class }
    } UNION {
        GRAPH ?graph {
            { ?class a owl:Class }
            UNION { ?class a rdfs:Class }
        }
    }
    OPTIONAL {
        ?class rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?vocab ?class ?endpointUrl
```

### Properties and number of endpoints where they are used

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?property (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    {
        { ?property a rdf:Property }
        UNION { ?property a owl:ObjectProperty }
        UNION { ?property a owl:DatatypeProperty }
        UNION { ?property a owl:AnnotationProperty }
        UNION{ ?property a owl:OntologyProperty }
    } UNION {
        GRAPH ?vocab {
            { ?property a rdf:Property }
            UNION { ?property a owl:ObjectProperty }
            UNION { ?property a owl:DatatypeProperty }
            UNION { ?property a owl:AnnotationProperty }
            UNION{ ?property a owl:OntologyProperty }
        }
    }
    OPTIONAL {
        ?property rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
    FILTER(isIRI(?property))
} GROUP BY ?vocab ?property ?count
```

#### List of endpoints where each property is used

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?property ?endpointUrl {
    {
        { ?property a rdf:Property }
        UNION { ?property a owl:ObjectProperty }
        UNION { ?property a owl:DatatypeProperty }
        UNION { ?property a owl:AnnotationProperty }
        UNION{ ?property a owl:OntologyProperty }
    } UNION {
        GRAPH ?graph {
            { ?property a rdf:Property }
            UNION { ?property a owl:ObjectProperty }
            UNION { ?property a owl:DatatypeProperty }
            UNION { ?property a owl:AnnotationProperty }
            UNION{ ?property a owl:OntologyProperty }
        }
    }
    OPTIONAL {
        ?property rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
    FILTER(isIRI(?property))
} GROUP BY ?vocab ?property
```

### Vocabularies and number of endpoints where they are used

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    GRAPH ?endpointUrl {
        ?endpointUrl void:sparqlEndpoint ?endpointUrl
    }
    OPTIONAL {
        ?elem rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?vocab
```

#### List of endpoints where each vocabularies is used

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab ?endpointUrl {
    GRAPH ?endpointUrl {
        ?endpointUrl void:sparqlEndpoint ?endpointUrl
    }
    OPTIONAL {
        ?elem rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?vocab ?endpointUrl
```

### Endpoints and the number of vocabularies they use

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?endpointUrl (COUNT(DISTINCT ?vocab) AS ?count) {
    GRAPH ?endpointUrl {
        ?endpointUrl void:sparqlEndpoint ?endpointUrl
    }
    OPTIONAL {
        ?elem rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?endpointUrl
```

### Endpoints and the vocabularies they use

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?endpointUrl ?vocab {
    GRAPH ?endpointUrl {
        ?endpointUrl void:sparqlEndpoint ?endpointUrl
    }
    OPTIONAL {
        ?elem rdfs:isDefinedBy ?vocab ;
            voaf:usageInDataset ?occurence .
        ?occurence voaf:inDataset ?endpointUrl .
    }
} GROUP BY ?endpointUrl ?vocab
```

### Cooccurence of vocabularies

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab1 ?vocab2 (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    ?elem1 rdfs:isDefinedBy ?vocab1 ;
        voaf:usageInDataset ?occurence1 .
    ?occurence1 voaf:inDataset ?endpointUrl .
  OPTIONAL {
    ?elem2 rdfs:isDefinedBy ?vocab2 ;
        voaf:usageInDataset ?occurence2 .
    ?occurence2 voaf:inDataset ?endpointUrl .
  	FILTER(STR(?vocab1) < STR(?vocab2))
  }
} GROUP BY ?vocab1 ?vocab2
```

### Vocabularies used alone

```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?vocab1 (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    ?elem1 rdfs:isDefinedBy ?vocab1 ;
        voaf:usageInDataset ?occurence1 .
    ?occurence1 voaf:inDataset ?endpointUrl .
  FILTER NOT EXISTS {
    ?elem2 rdfs:isDefinedBy ?vocab2 ;
        voaf:usageInDataset ?occurence2 .
    ?occurence2 voaf:inDataset ?endpointUrl .
  	FILTER(STR(?vocab1) != STR(?vocab2))
  }
} GROUP BY ?vocab1
```
