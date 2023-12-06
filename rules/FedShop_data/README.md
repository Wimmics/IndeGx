# Rules for the extraction of real probabilities for the configuration of dataset description generation as part of the DeKaloG project

- [x] Number of Dataset descriptions
- General or for each dataset
    - [x] Basic statistics (triples, classes, properties, distinctSubjects, distinctObjects)
    - Classes
        - [x] Number of instances
        - Properties around instances
            - [x] Number of instances of properties around class instances
            - Objects
                - [x] Datatypes
                    - [x] Min/max values
                - [x] Classes
                - [x] Number of different values
    - [x] Associations (class - property - class)

## Result retrieval queries

### Meta stats on datasets and endpoints

#### Number of endpoints with dataset descriptions
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?countEndpoint) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
    }
} 
```

##### Result
103

#### Number of dataset description with dataset instance of DATASET classes
```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT (COUNT(DISTINCT ?dataset) AS ?count) {
        VALUES ?c { void:Dataset dcat:Dataset dctype:Dataset sd:Dataset schema:Dataset dct:Dataset}
        GRAPH ?endpoint {
            ?endpoint dcat:servesDataset ?dataset
        }
        GRAPH ?datasetGraph {
            ?dataset a ?c
        }
    } 
```

##### Result
2429

#### Number of dataset per endpoint
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?endpoint (COUNT(DISTINCT ?dataset) AS ?countDataset) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
    }
} GROUP BY ?endpoint
ORDER BY DESC(?countDataset)
```

#### Average number of dataset per endpoint
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT (AVG(?countDataset) AS ?average) {
  SELECT DISTINCT ?endpoint (COUNT(DISTINCT ?dataset) AS ?countDataset) {
      GRAPH ?endpoint {
          ?endpoint dcat:servesDataset ?dataset
      }
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
    }
  } GROUP BY ?endpoint
}
```

##### Result
152.93

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
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
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
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
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
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
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
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
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
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
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
SELECT DISTINCT ?c (ROUND(AVG(?count)) AS ?average) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?p ?o
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:inDataset ?dataset ;
        void:class ?c ;
        void:entities ?count .
} GROUP BY ?c
```

#### Number of instances of DATASET classes per dataset
```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?c (MIN(?count) AS ?minC) (MAX(?count) AS ?maxC) (COUNT(DISTINCT ?dataset) as ?countDataset) {
  {
    SELECT DISTINCT ?dataset ?c ?count {
        VALUES ?c { void:Dataset dcat:Dataset dctype:Dataset sd:Dataset schema:Dataset dct:Dataset}
        GRAPH ?endpoint {
            ?endpoint dcat:servesDataset ?dataset
        }
        GRAPH ?datasetGraph {
            ?dataset ?p ?o
        }
        ?dataset void:classPartition ?classPartition .
        ?classPartition void:inDataset ?dataset ;
            void:class ?c ;
            void:entities ?count .
    } GROUP BY ?dataset ?c ?count 
  }
} GROUP BY ?c 
```

#### Properties appearing around class instances with number of triples, class and datatype of object, min/max of values

#### Type of the objects of the properties appearing around instances of classeserties appearing around instances of classes

##### In general
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c ?p ?oc (SUM(?cpoccount) AS ?cpoccountTotal) {
  SELECT DISTINCT ?dataset ?c ?p ?oc ?cpoccount {
      GRAPH ?endpoint {
          ?endpoint dcat:servesDataset ?dataset
      }
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
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
  }
} GROUP BY ?c ?p ?oc 
ORDER BY DESC(?cpoccountTotal) DESC(?c) DESC(?p) DESC(?oc)
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
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
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
ORDER BY DESC(?cpoccount) DESC(?c) DESC(?p) DESC(?oc)
```

##### Average among datasets
```sparql
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c ?p ?oc (AVG(?cpoccount) AS ?cpoccountAverage) {
  SELECT DISTINCT ?dataset ?c ?p ?oc ?cpoccount {
        GRAPH ?endpoint {
            ?endpoint dcat:servesDataset ?dataset
        }
        GRAPH ?datasetGraph {
            ?dataset ?dp ?do
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
    FILTER(?c = dcat:Dataset)
    FILTER(?p = dcat:distribution)
    FILTER(?oc = dcat:Distribution)
  }
} GROUP BY ?c ?p ?oc 
ORDER BY DESC(?cpoccountTotal) DESC(?c) DESC(?p) DESC(?oc)
```

#### Properties and types of objects appearing around instances of DATASET classes, with min, max and average number of occurrences in a dataset

```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?p ?oc (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (COUNT(DISTINCT ?dataset) AS ?countAllDataset) {
  {
    SELECT DISTINCT ?c ?p ?oc (MIN(?cpoccount) AS ?minC) (MAX(?cpoccount) AS ?maxC) (AVG(?cpoccount) AS ?average) ?dataset {
      {
          SELECT DISTINCT ?dataset ?c ?p ?oc ?cpoccount {
              VALUES ?c { void:Dataset dcat:Dataset dctype:Dataset sd:Dataset schema:Dataset dct:Dataset}
              GRAPH ?endpoint {
                  ?endpoint dcat:servesDataset ?dataset
              }
              GRAPH ?datasetGraph {
                  ?dataset ?dp ?do
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
          }
        } GROUP BY ?c ?p ?oc ?dataset
    }
  } GROUP BY ?p ?oc 
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
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
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
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
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
SELECT DISTINCT  ?c ?p ?oc (ROUND(AVG(?cpodcount)) AS ?avgCPODCount){
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
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
#### Properties and datatypes of objects appearing around instances of DATASET classes, with min, max and average number of occurrences in a dataset

```sparql
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?p ?od (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (COUNT(DISTINCT ?dataset) AS ?countAllDataset) {
  {
    SELECT DISTINCT ?c ?p ?od (MIN(?cpodcount) AS ?minC) (MAX(?cpodcount) AS ?maxC) (AVG(?cpodcount) AS ?average) ?dataset {
      {
            SELECT DISTINCT ?dataset ?c ?p ?od ?cpodcount {
                VALUES ?c { void:Dataset dcat:Dataset dctype:Dataset sd:Dataset schema:Dataset dct:Dataset }
                GRAPH ?endpoint {
                    ?endpoint dcat:servesDataset ?dataset
                }
                GRAPH ?datasetGraph {
                    ?dataset ?dp ?do
                }
                ?dataset void:classPartition ?classPartition.
                ?classPartition void:inDataset ?dataset ;
                    void:class ?c ;
                    void:propertyPartition ?classPropertyPartition .
                ?classPropertyPartition void:inDataset ?dataset ;
                    void:property ?p ;
                    void:classPartition ?objectClassPartition .
                ?objectClassPartition void:inDataset ?dataset ;
                    void:datatype ?od ;
                    void:entities ?cpodcount .
                } GROUP BY ?dataset ?c ?p ?od ?cpodcount
            }
        } GROUP BY ?c ?p ?od ?dataset
    }
} GROUP BY ?p ?od
```

### Associations

#### In general
```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c1 ?p ?c2 (SUM(?c1count) AS ?totalC1Count) (SUM(?c2count) AS ?totalC2Count) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
    }
    ?dataset void:classPartition ?classPartition1, ?classPartition2.
    ?classPartition1 void:inDataset ?dataset ;
        void:class ?c1 ;
        void:entities ?c1count ;
        void:propertyPartition ?class1PropertyPartition .
    ?class1PropertyPartition void:inDataset ?dataset ;
        void:property ?p ;
        void:classPartition ?objectClass2Partition .
    ?objectClass2Partition void:inDataset ?dataset ;
        void:class ?c2 ;
        void:entities ?c2count .
} GROUP BY ?c1 ?p ?c2
ORDER BY DESC(?totalC1Count) DESC(?totalC2Count)
```

#### Per dataset
```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT DISTINCT ?c1 ?p ?c2 (SUM(?c1count) AS ?totalC1Count) (SUM(?c2count) AS ?totalC2Count) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?dp ?do
    }
    ?dataset void:classPartition ?classPartition1, ?classPartition2.
    ?classPartition1 void:inDataset ?dataset ;
        void:class ?c1 ;
        void:entities ?c1count ;
        void:propertyPartition ?class1PropertyPartition .
    ?class1PropertyPartition void:inDataset ?dataset ;
        void:property ?p ;
        void:classPartition ?objectClass2Partition .
    ?objectClass2Partition void:inDataset ?dataset ;
        void:class ?c2 ;
        void:entities ?c2count .
} GROUP BY ?c1 ?p ?c2
ORDER BY DESC(?totalC1Count) DESC(?totalC2Count)
```