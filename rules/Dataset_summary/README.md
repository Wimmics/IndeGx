# Rules for the extraction of dataset summaries

For each endpoint:

- [x] Basic statistics (triples, classes, properties, datatypes, distinctSubjects, distinctObjects)
- [x] Classes
    - [x] Number of instances
    - [x] Properties around instances
        - [x] Number of instances of properties around class instances
        - Objects
            - [x] Datatypes
                - [x] Min/max values
            - [x] Classes
            - [x] Number of different values
    - [x] Cooccurrences around the same instance (class - classes)
        - < 8 classes
- Properties
    - [x] Number of triples
    - [x] Cooccurrences around the same instance (property - properties)
        - < 12 properties
- [x] Datatypes
    -> Post-processing
    - [ ] Triples
        -> Post-processing
    - [ ] Number for values
- [x] Associations (class - property - class/datatype)
- [ ] Namespaces
    - [ ] Number of triples
    - [ ] Number of subjects
    - [ ] Number of objects
    - [ ] Number of properties
        - -> Post-processing
    - [ ] Number of classes
        - -> Post-processing
    - [x] Associations (subject namespace - property - object namespace)

qudt:lowerBound
qudt:upperBound
<http://qudt.org/schema/qudt>
## Result retrieval queries

### List of endpoints with any partition

```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?endpointGraph {
    kgi: sd:namedGraph ?endpointGraph .
    GRAPH ?endpointGraph {
     ?endpointGraph ?partitionProperty ?o
  }
    FILTER(?partitionProperty = void:classPartition || ?partitionProperty = void:propertyPartition )
}
```
27 endpoints as result

### List of endpoints with any summary

```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?endpointGraph {
    kgi: sd:namedGraph ?endpointGraph .
    GRAPH ?endpointGraph {
     ?endpointGraph kgi:summary ?summaryGraph
  }
  GRAPH ?summaryGraph {
    ?s ?p ?o
  }
}
```
7 endpoints as result

### List of endpoints with any cooccurrence partition
    
```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?endpointGraph {
    kgi: sd:namedGraph ?endpointGraph .
    GRAPH ?endpointGraph {
        ?endpointGraph ?partitionProperty ?partition1, ?partition2 .
        ?partition1 ?linkProperty ?o1 .
        ?partition2 ?linkProperty ?o2 .  
    }
    FILTER(STR(?o1) < STR(?o2)) 
    VALUES (?partitionProperty ?linkProperty) { (void:classPartition void:class) (void:propertyPartition void:property) }
}
```

### List of classes for each endpoint

### List of properties for each endpoint

### List of vocabularies used in an endpoint

### List of namespaces used in an endpoint

### List of langages used in an endpoint