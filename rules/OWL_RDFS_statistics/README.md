# Vocabulary Statistics rules

This folder contains the generation assets used to extract statistics on the usage of known vocabularies in datasets

## Generation of LOV_redux from LOV dump

Supplementary files to load because they are not in the LOV dump:
```sparql
```

#### Classes

```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
CONSTRUCT {
    ?elem a owl:Class;
    rdfs:isDefinedBy ?vocabGraph .
} WHERE {
    GRAPH ?vocabGraph {
        {
            ?elem a ?type .
            FILTER( ?type IN ( owl:Class, rdfs:Class, skos:Concept ) )
            FILTER( ?elem NOT IN ( owl:Class, rdfs:Class, skos:Concept ) )
        }
    }
    FILTER(isIRI(?elem))
}
```

#### Properties

```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
CONSTRUCT {
    ?elem a rdf:Property;
    rdfs:isDefinedBy ?vocabGraph .
} WHERE {
    GRAPH ?vocabGraph {
        {
            ?elem a ?type .
            FILTER( ?type IN ( owl:ObjectProperty, owl:DatatypeProperty, owl:AnnotationProperty, owl:OntologyProperty, rdf:Property ) )
        } UNION {
            ?elem ?prop ?type .
            FILTER( ?prop IN ( owl:domain, owl:range ) )
        }
    }
    FILTER(isIRI(?elem))
}
```

### Usual Suspects

#### Classes

```sparql
PREFIX spin: <http://spinrdf.org/spin#>
PREFIX sp: <http://spinrdf.org/sp#>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX swrl: <http://www.w3.org/2003/11/swrl#>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
CONSTRUCT {
    ?elem a owl:Class;
    rdfs:isDefinedBy ?vocabGraph .
} WHERE {
    GRAPH ?vocabGraph {
        {
            ?elem a ?type .
            FILTER( ?type IN ( owl:Class, rdfs:Class, skos:Concept ) )
            FILTER( ?elem NOT IN ( owl:Class, rdfs:Class, skos:Concept ) )
        }
    }
    FILTER(isIRI(?elem))
    VALUES ?vocabGraph {
        skos:
        rdf:
        rdfs:
        owl:
        sh:
    	spin:
    	foaf:
    	dcterms:
    	schema:
    }
}
```

#### Properties

```sparql
PREFIX spin: <http://spinrdf.org/spin#>
PREFIX sp: <http://spinrdf.org/sp#>
PREFIX schema: <http://schema.org/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX swrl: <http://www.w3.org/2003/11/swrl#>
PREFIX sh: <http://www.w3.org/ns/shacl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
CONSTRUCT {
    ?elem a rdf:Property;
    rdfs:isDefinedBy ?vocabGraph .
} WHERE {
    GRAPH ?vocabGraph {
        {
            ?elem a ?type .
            FILTER( ?type IN ( owl:ObjectProperty, owl:DatatypeProperty, owl:AnnotationProperty, owl:OntologyProperty, rdf:Property ) )
        } UNION {
            ?elem ?prop ?type .
            FILTER( ?prop IN ( owl:domain, owl:range ) )
        }
    }
    FILTER(isIRI(?elem))
    VALUES ?vocabGraph {
        skos:
        rdf:
        rdfs:
        owl:
        sh:
    	spin:
    	foaf:
    	dcterms:
    	schema:
    }
}
```

## Results

### Classes

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT DISTINCT ?class (COUNT(DISTINCT ?endpointUrl) AS ?count) {
    ?class a owl:Class;
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
SELECT DISTINCT ?vocab ?property (COUNT(DISTINCT ?occurence) AS ?count) {
    ?property a rdf:Property ;
        rdfs:isDefinedBy ?vocab ;
        voaf:usageInDataset ?occurence .
} GROUP BY ?property ?vocab
```