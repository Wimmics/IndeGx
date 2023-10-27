# Rules for the extraction of real probabilities for the configuration of dataset description generation as part of the DeKaloG project

- Classes
    - [x] Number of instances
    - Properties around instances
        - [x] Number of instances of properties around class instances
        - Objects
            - [x] Datatypes
                - [x] Min/max values
            - [x] Classes
            - [x] Number of different values

## Result retrieval queries

### Basic statistics on datasets
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?triples ?classes ?properties ?distinctSubjects ?distinctObjects {
    OPTIONAL {
      ?dataset void:triples ?triples .
    }
    OPTIONAL {
      ?dataset void:classes ?classes .
    }
    OPTIONAL {
      ?dataset void:properties ?properties .
    }
    OPTIONAL {
      ?dataset void:distinctSubjects ?distinctSubjects .
    }
    OPTIONAL {
      ?dataset void:distinctObjects ?distinctObjects .
    }
}
```

### Number of classes instances
```sparql
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?c ?count {
  ?dataset void:classPartition ?classPartition .
  ?classPartition void:inDataset ?dataset ;
  	void:class ?c ;
  	void:entities ?count .
} GROUP BY ?dataset ?c ?count
```

### Properties appearing around class instances with number of triples, class and datatype of object, min/max of values

#### Type of the objects of the properties appearing around instances of classes
```sparql
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?c ?p ?cpcount ?oc ?cpoccount {
  ?dataset void:classPartition ?classPartition.
  ?classPartition void:inDataset ?dataset ;
    void:class ?c ;
    void:propertyPartition ?classPropertyPartition .
  ?classPropertyPartition void:inDataset ?dataset ;
    void:property ?p ;
    void:classPartition ?objectClassPartition .
  ?objectClassPartition void:inDataset ?dataset ;
    void:class ?oc ;
    void:entities ?cpoccount .
} GROUP BY ?dataset ?c ?p ?cpcount ?oc ?cpoccount
```

#### Datatype of the objects of the properties appearing around instances of classes
```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?c ?p ?cpcount ?oc ?cpodcount ?min ?max {
  ?dataset void:classPartition ?classPartition.
  ?classPartition void:inDataset ?dataset ;
    void:class ?c ;
    void:propertyPartition ?classPropertyPartition .
  ?classPropertyPartition void:inDataset ?dataset ;
    void:property ?p ;
    void:classPartition ?objectDatatypePartition .
  ?objectDatatypePartition void:inDataset ?dataset ;
    void:datatype ?oc ;
    void:entities ?cpodcount .
  OPTIONAL {
    ?objectDatatypePartition kgi:minimum ?min ;
    kgi:maximum ?max .
  }
} GROUP BY ?dataset ?c ?p ?cpcount ?oc ?cpodcount ?min ?max
```