# Set of rules for the test of well known implementation mistakes in SPARQL servers

## Differend RAND() calls, same results

Some endpoints return the same random number for two different calls of the RAND function in the same query.
Query to obtain the list of endpoints making this mistake:

```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT ?endpoint {
  ?endpoint sd:feature kgi:BadRandomNumber ;
  	a dcat:DataService , sd:Service .
}
```

## Different NOW() calls, different values

Some endpoints return the different values for two different calls of the NOW function in the same query.
Query to obtain the list of endpoints making this mistake:

```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
SELECT DISTINCT ?endpoint {
    ?endpoint sd:feature kgi:BadNOWtime ;
  	    a dcat:DataService , sd:Service .
}
```