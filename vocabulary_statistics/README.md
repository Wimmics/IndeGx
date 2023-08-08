## Generation of LOV_redux from LOV dump

### Classes

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

### Properties

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

## Generation of LOV_redux_usual-suspects from LOV dump

Not found: SWRL

Supplementary files to load because they are not in the LOV dump:
```sparql
LOAD <https://raw.githubusercontent.com/Wimmics/IndeGx/VocabularyExperiment/data/skos.ttl> INTO GRAPH <http://www.w3.org/2004/02/skos/core#> ;
LOAD <https://raw.githubusercontent.com/Wimmics/IndeGx/VocabularyExperiment/data/spin.ttl> INTO GRAPH <http://spinrdf.org/spin#> ;
LOAD <https://raw.githubusercontent.com/Wimmics/IndeGx/VocabularyExperiment/data/owl.ttl> INTO GRAPH <http://www.w3.org/2002/07/owl#>
```

### Classes

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
    ?elem a rdf:Class;
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

### Properties

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