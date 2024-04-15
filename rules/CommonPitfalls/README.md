# Set of rules for the test of well known pitfalls in SPARQL servers and RDF datasets



## Number of endpoints

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

## TODO list

- Load endpoint description, check for features and RDFSEntailment
- https://github.com/w3c/sparql-dev/issues/195

## Notes:

19/03/2024:
154 endpoints with bad random
21 with bad NOW
