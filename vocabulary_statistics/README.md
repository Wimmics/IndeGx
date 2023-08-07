## Generation of LOV_redix from LOV dump

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