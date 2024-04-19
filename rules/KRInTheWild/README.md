# Rule set for experimentation related to the KR in The wild track submission


## Endpoints

### List of endpoints

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?endpoint {
  ?endpoint a dcat:DataService , sd:Service .
} ORDER BY ASC(?endpoint)
```

### Number of endpoints

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?count) {
  ?endpoint a dcat:DataService , sd:Service .
}
```

## SPARQL pitfalls

### Differend RAND() calls, same results

Some endpoints return the same random number for two different calls of the RAND function in the same query.
Query to obtain the list of endpoints making this mistake:

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?count) {
  ?endpoint sd:feature kgi:BadRandomNumber ;
  	a dcat:DataService , sd:Service .
}
```

### Different NOW() calls, different values

Some endpoints return the different values for two different calls of the NOW function in the same query.
Query to obtain the list of endpoints making this mistake:

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?count) {
    ?endpoint sd:feature kgi:BadNOWtime ;
  	    a dcat:DataService , sd:Service .
}
```

##  RDFS

### No resource is an instances of rdfs:Resource

Some endpoints return the different values for two different calls of the NOW function in the same query.
Query to obtain the list of endpoints making this mistake:

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?count) {
    ?endpoint sd:feature kgi:BasicRDFSEntailmentFailed ;
  	    a dcat:DataService , sd:Service .
}
```

## List of endpoints and their detected errors

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?endpoint ?badRandom ?badTimeNow ?noRDFSEntailment {
  	?endpoint a dcat:DataService , sd:Service .
  BIND( EXISTS { ?endpoint sd:feature kgi:BadRandomNumber . } AS ?badRandom )
    BIND( EXISTS { ?endpoint sd:feature kgi:BadNOWtime . } AS ?badTimeNow )
    BIND( EXISTS { ?endpoint sd:feature kgi:BasicRDFSEntailmentFailed . } AS ?noRDFSEntailment )
}
```

## List of server names appearing in HTTP headers

### Unified names

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?endpoint ?server {
    ?endpoint kgi:server ?server ;
  	    a dcat:DataService , sd:Service .
}
```

### Number of endpoints with each kind of server with unified names

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?server (COUNT(DISTINCT ?endpoint) AS ?count) {
    ?endpoint kgi:server ?server ;
  	    a dcat:DataService , sd:Service .
} GROUP BY ?server
```

### Detailed names with version

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT  ?endpoint ?serverGet {
    ?endpoint kgi:serverGet ?serverGet ;
  	    a dcat:DataService , sd:Service .
}
```

### Number of endpoints with each kind of server with detailed names with version

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?server (COUNT(DISTINCT ?endpoint) AS ?count) {
    ?endpoint kgi:serverGet ?server ;
  	    a dcat:DataService , sd:Service .
} GROUP BY ?server
```

## Vocabularies and their usages

### List of vocabularies

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
SELECT DISTINCT ?vocab {
    ?vocab a owl:Ontology .
}
```

### Vocabularies and the number of endpoints using them

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX vann: <http://purl.org/vocab/vann/>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?vocab (COUNT(DISTINCT ?endpoint) AS ?count) {
    ?vocab voaf:usageInDataset ?occurrence .
    ?occurrence voaf:inDataset ?endpoint .
} GROUP BY ?vocab
                
```

## LOV subset

The `lov_namespaces_18042024.ttl` was extracted from the LOV endpoint on the 18/04/2024 using the query:
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