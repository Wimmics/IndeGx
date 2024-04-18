# rule set for experimentation related to the KR in The wild track submission

## LOV subset

the `lov_namespaces_18042024.ttl` was extracted from the LOV endpoint on the 18/04/2024 using the query:
```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX vann: <http://purl.org/vocab/vann/>
CONSTRUCT {
    ?vocab a owl:Ontology ;
        vann:preferredNamespaceUri ?namespace .
} {
    ?vocab a owl:Ontology .
    OPTIONAL {
        ?vocab vann:preferredNamespaceUri ?namespace .
    }
    FILTER( isIRI(?vocab))
    BIND( REPLACE( REPLACE( IF( BOUND(?namespace), STR(?namespace), STR(?vocab)), "#$", ""), "/$", "") AS ?namespace_string)
}
```