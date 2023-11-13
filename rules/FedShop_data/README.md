# Rules for the extraction of real probabilities for the configuration of dataset description generation as part of the DeKaloG project

- [ ] Number of Dataset descriptions
- [ ] Size of the extracted dataset description
- General or for each dataset
    - [ ] Basic statistics (triples, classes, properties, distinctSubjects, distinctObjects)
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

##### In general
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT (SUM(?triples) AS ?triplesAll) (SUM(?classes) AS ?classesAll) (SUM(?properties) AS ?propertiesAll) (SUM(?distinctSubjects) AS ?distinctSubjectsAll) (SUM(?distinctObjects) AS ?distinctObjectsAll) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
  	?dataset void:triples ?triples ;
    	void:classes ?classes ;
        void:properties ?properties ;
        void:distinctSubjects ?distinctSubjects ;
        void:distinctObjects ?distinctObjects .
} 
```

##### Per dataset 
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?triples ?classes ?properties ?distinctSubjects ?distinctObjects {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
      ?dataset void:triples ?triples ;
               void:classes ?classes ;
               void:properties ?properties ;
               void:distinctSubjects ?distinctSubjects ;
               void:distinctObjects ?distinctObjects .
} GROUP BY ?dataset ?triples ?classes ?properties ?distinctSubjects ?distinctObjects
```

##### Average overall
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT (AVG(?triples) AS ?avgTriples) (AVG(?classes) AS ?avgClasses) (AVG(?properties) AS ?avgProperties) (AVG(?distinctSubjects) AS ?avgDistinctSubjects) (AVG(?distinctObjects) AS ?avgDistinctObjects) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
      ?dataset void:triples ?triples ;
               void:classes ?classes ;
               void:properties ?properties ;
               void:distinctSubjects ?distinctSubjects ;
               void:distinctObjects ?distinctObjects .
}
```

### Number of classes instances

##### In general
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c (SUM(?count) AS ?countAll) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:inDataset ?dataset ;
        void:class ?c ;
        void:entities ?count .
} GROUP BY ?c 
```

##### Per dataset 
```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?dataset ?c ?count {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:inDataset ?dataset ;
        void:class ?c ;
        void:entities ?count .
} GROUP BY ?dataset ?c ?count
```

##### Average among datasets
```sparql
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?c (AVG(?count) AS ?average) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:inDataset ?dataset ;
        void:class ?c ;
        void:entities ?count .
} GROUP BY ?c
```

#### Properties appearing around class instances with number of triples, class and datatype of object, min/max of values

#### Type of the objects of the properties appearing around instances of classeserties appearing around instances of classes

##### In general
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c ?p ?oc (SUM(?cpoccount) AS ?cpoccountAll) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY ?c ?p ?oc
```

##### Per dataset 
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?c ?p ?oc ?cpoccount {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY ?dataset ?c ?p ?oc ?cpoccount
```

##### Average among datasets
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c ?p ?oc (AVG(?cpoccount) AS ?avgCPOCCount) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY  ?c ?p ?oc
```

#### Datatype of the objects of the properties appearing around instances of classes

##### In general
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c ?p ?oc (SUM(?cpodcount) AS ?cpodcountsum) (MIN(?min) AS ?minAll) (MAX(?max) AS ?maxAll) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY ?c ?p ?oc
```

##### Per dataset 
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?dataset ?c ?p ?oc ?cpodcount ?min ?max {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY ?dataset ?c ?p ?oc ?cpodcount ?min ?max
```

##### Average among datasets
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT  ?c ?p ?oc (AVG(?cpodcount) AS ?avgCPODCount){
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?dataset {
    }
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
} GROUP BY ?c ?p ?oc ?cpodcount
```