# Generation of a WATdiv configuration file from statistics extracted from dataset descriptions

This script generates a WATdiv configuration file from statistics extracted from dataset descriptions.
The configuration will generate a dataset description that will be used to describe the dataset of a fictive shop in the setting of FedShop. Each shop will correspond to one dataset. Each dataset will be described by a description containing information about the shop with properties appearing in the same proportion as the descriptions found in online datasets.

## Limitations set on the dataset description
The classes and properties will be limited to those that are both:
- used in dataset descriptions online
- appear in more than one dataset description

As watdiv do not make it possible to define entities that are instances of several classes, we will only declare one instance of dcat:Dataset at the root of the dataset description. dcat:Dataset is the most often used class to type the resource describing a dataset. Properties appearing around other Dataset classes have their number of apparition added to the dcat:Dataset.

## Queries used to extract statistics

The data was extracted from 101 endpoints.

### Number of datasets

```sparql
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT (COUNT(DISTINCT ?endpoint) AS ?countAllDataset) {
    {
        SELECT DISTINCT ?endpoint  {
            GRAPH ?endpoint {
                ?endpoint dcat:servesDataset ?dataset
            }
            GRAPH ?datasetGraph {
                { ?dataset a dcat:Dataset }
                UNION { ?dataset a void:Dataset }
                UNION { ?dataset a dcmitype:Dataset }
                UNION { ?dataset a schema:Dataset }
                UNION { ?dataset a sd:Dataset }
                UNION { ?dataset a dataid:Dataset }
            }
            ?dataset void:classPartition ?classPartition.
            ?classPartition void:inDataset ?dataset ;
                void:class ?c ;
                void:propertyPartition ?classPropertyPartition .
            ?classPropertyPartition void:inDataset ?dataset ;
                void:property ?p ;
                void:classPartition ?objectClassPartition .
            ?objectClassPartition void:inDataset ?dataset ;
                void:class ?oc .
        }
    }
}
```
Result: 1651

### Number of instances of classes in dataset descriptions

For instances of classes that are not Datasets. There is alway only one instance of Dataset

```sparql
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?c (MIN(?count) AS ?minCount) (MAX(?count) AS ?maxCount) (ROUND(AVG(?count)) as ?avgCount) (COUNT(DISTINCT ?endpoint) as ?countDataset) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:class ?c ;
        void:entities ?count .
    FILTER( NOT EXISTS {
      GRAPH ?datasetGraph {
          ?dataset ?pd ?do .
          ?s a ?c .
          VALUES ?dc { void:Dataset dcat:Dataset dcmitype:Dataset sd:Dataset schema:Dataset dct:Dataset }
          ?s a ?dc .
      }
    } )
    FILTER(?c != void:Dataset && ?c != dcat:Dataset  && ?c != dcmitype:Dataset  && ?c != sd:Dataset  && ?c != schema:Dataset  && ?c != dct:Dataset  && ! STRSTARTS(STR(?c), STR(owl:)) && ! STRSTARTS(STR(?c), STR(rdf:)) && ! STRSTARTS(STR(?c), STR(rdfs:)) )
} GROUP BY ?c
```

### Association of classes and properties to datasets

#### Properties and types of objects appearing around instances, with min, max, and average number of occurrences in a dataset. Instances of dataset classes are grouped into dcat:Dataset

##### For instances of classes that are not Datasets. 
```sparql
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?c ?p ?oc (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (COUNT(DISTINCT ?endpoint) AS ?countAllDataset) {
    {
        SELECT ?cGrouped ?p ?ocGrouped (MIN(?cpoccount) AS ?minC) (MAX(?cpoccount) AS ?maxC) (AVG(?cpoccount) AS ?average) ?endpoint {
            {
                SELECT DISTINCT ?endpoint ?c ?p ?oc ?cpoccount {
                    GRAPH ?endpoint {
                        ?endpoint dcat:servesDataset ?dataset
                    }
                    GRAPH ?datasetGraph {
                      ?dataset ?pd ?s .
            		  ?s ?p ?o .
                      ?s a ?c .
                      ?o a ?oc .
                      VALUES ?dc { void:Dataset dcat:Dataset dcmitype:Dataset sd:Dataset schema:Dataset dct:Dataset }
                      FILTER( NOT EXISTS { ?s a ?dc })
                      FILTER( NOT EXISTS { ?o a ?dc })
                      FILTER( ?c != owl:Class )
                      FILTER( ?c != rdfs:Class )
                      FILTER( ?oc != owl:Class )
                      FILTER( ?oc != rdfs:Class )
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
                } GROUP BY ?endpoint ?c ?p ?oc ?cpoccount
            }
            BIND(IF((?c = dcat:Dataset || ?c = void:Dataset || ?c = dcmitype:Dataset || ?c = schema:Dataset || ?c = sd:Dataset || ?c = dataid:Dataset ), dcat:Dataset, ?c ) AS ?cGrouped)
            BIND(IF((?oc = dcat:Dataset || ?oc = void:Dataset || ?oc = dcmitype:Dataset || ?oc = schema:Dataset || ?oc = sd:Dataset || ?oc = dataid:Dataset ), dcat:Dataset, ?oc ) AS ?ocGrouped)
        } GROUP BY ?endpoint ?cGrouped ?p ?ocGrouped
    }
    BIND(?cGrouped AS ?c)
    BIND(?ocGrouped AS ?oc)
} GROUP BY ?c ?p ?oc 
```

##### For instances that are Datasets. 

```sparql
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?c ?p ?oc (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (COUNT(DISTINCT ?endpoint) AS ?countAllDataset) {
    {
        SELECT ?cGrouped ?p ?ocGrouped (MIN(?cpoccount) AS ?minC) (MAX(?cpoccount) AS ?maxC) (AVG(?cpoccount) AS ?average) ?endpoint {
            {
                SELECT DISTINCT ?endpoint ?c ?p ?oc ?cpoccount {
                    GRAPH ?endpoint {
                        ?endpoint dcat:servesDataset ?dataset
                    }
                    GRAPH ?datasetGraph {
                        ?dataset ?dp ?do ;
            				a ?c .
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
                } GROUP BY ?endpoint ?c ?p ?oc ?cpoccount
            }
            BIND( dcat:Dataset AS ?cGrouped)
            BIND(IF((?oc = dcat:Dataset || ?oc = void:Dataset || ?oc = dcmitype:Dataset || ?oc = schema:Dataset || ?oc = sd:Dataset || ?oc = dataid:Dataset ), dcat:Dataset, ?oc ) AS ?ocGrouped)
        } GROUP BY ?endpoint ?cGrouped ?p ?ocGrouped
    }
    BIND(?cGrouped AS ?c)
    BIND(?ocGrouped AS ?oc)
} GROUP BY ?c ?p ?oc
```

#### Properties and datatypes of objects appearing around instances of DATASET classes, with min, max, and average number of occurrences in a dataset

##### For instances of classes that are not Datasets. 
```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?c ?p ?od (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (MIN(?minValue) AS ?minValueAll) (MAX(?maxValue) as ?maxValueAll) (COUNT(DISTINCT ?endpoint) AS ?countAllDataset) {
    {
        SELECT DISTINCT ?cGrouped ?p ?od (MIN(?cpodcount) AS ?minC) (MAX(?cpodcount) AS ?maxC) (AVG(?cpodcount) AS ?average) (MIN(?min) AS ?minValue) (MAX(?max) as ?maxValue) ?endpoint {
            {
                SELECT DISTINCT ?endpoint ?c ?p ?od ?cpodcount ?min ?max {
                    GRAPH ?endpoint {
                        ?endpoint dcat:servesDataset ?dataset
                    }
                    GRAPH ?datasetGraph {
                        ?dataset ?pd ?s .
            		    ?s ?p ?o ;
                            a ?c .
                        VALUES ?dc { void:Dataset dcat:Dataset dcmitype:Dataset sd:Dataset schema:Dataset dct:Dataset }
                        FILTER( NOT EXISTS { ?s a ?dc })
                        FILTER( ?c != owl:Class )
                        FILTER( ?c != rdfs:Class )
            			FILTER( IsLiteral( ?o ) )
                    }
                    ?dataset void:classPartition ?classPartition.
                    ?classPartition void:inDataset ?dataset ;
                        void:class ?c ;
                        void:propertyPartition ?classPropertyPartition .
                    ?classPropertyPartition void:inDataset ?dataset ;
                        void:property ?p ;
                        void:classPartition ?objectDatatypePartition .
                    ?objectDatatypePartition void:inDataset ?dataset ;
                        void:datatype ?od ;
                        void:entities ?cpodcount .
                    OPTIONAL {
                        ?objectDatatypePartition kgi:minimum ?min ;
                        kgi:maximum ?max .
                    }
                } GROUP BY ?endpoint ?c ?p ?od ?cpodcount ?min ?max
            }
          	BIND(IF((?c = dcat:Dataset || ?c = void:Dataset || ?c = dcmitype:Dataset || ?c = schema:Dataset || ?c = sd:Dataset || ?c = dataid:Dataset ), dcat:Dataset, ?c ) AS ?cGrouped)
        } GROUP BY ?cGrouped ?p ?od ?endpoint
    }
    BIND(?cGrouped AS ?c)
} GROUP BY ?c ?p ?od
```

##### For instances that are Datasets. 

```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX adms: <http://www.w3.org/ns/adms>
PREFIX bibo: <http://purl.org/ontology/bibo/>
PREFIX cc: <http://creativecommons.org/ns#>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dce: <http://purl.org/dc/elements/1.1/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mod: <https://w3id.org/mod#>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX pav: <http://purl.org/pav/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX sto: <https://w3id.org/i40/sto#>
PREFIX vcard: <http://www.w3.org/2006/vcard/ns#>
PREFIX voaf: <http://purl.org/vocommons/voaf#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX voidext: <http://purl.org/query/voidext#>
PREFIX xhv: <http://www.w3.org/1999/xhtml/vocab#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?c ?p ?od (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (MIN(?minValue) AS ?minValueAll) (MAX(?maxValue) as ?maxValueAll) (COUNT(DISTINCT ?endpoint) AS ?countAllDataset) {
    {
        SELECT DISTINCT ?cGrouped ?p ?od (MIN(?cpodcount) AS ?minC) (MAX(?cpodcount) AS ?maxC) (AVG(?cpodcount) AS ?average) (MIN(?min) AS ?minValue) (MAX(?max) as ?maxValue) ?endpoint {
            {
                SELECT DISTINCT ?endpoint ?c ?p ?od ?cpodcount ?min ?max {
                    GRAPH ?endpoint {
                        ?endpoint dcat:servesDataset ?dataset
                    }
                    GRAPH ?datasetGraph {
                        ?dataset ?dp ?do ;
            				a ?c .
                    }
                    ?dataset void:classPartition ?classPartition.
                    ?classPartition void:inDataset ?dataset ;
                        void:class ?c ;
                        void:propertyPartition ?classPropertyPartition .
                    ?classPropertyPartition void:inDataset ?dataset ;
                        void:property ?p ;
                        void:classPartition ?objectDatatypePartition .
                    ?objectDatatypePartition void:inDataset ?dataset ;
                        void:datatype ?od ;
                        void:entities ?cpodcount .
                    OPTIONAL {
                        ?objectDatatypePartition kgi:minimum ?min ;
                        kgi:maximum ?max .
                    }
                } GROUP BY ?endpoint ?c ?p ?od ?cpodcount ?min ?max
            }
            BIND( dcat:Dataset AS ?cGrouped)
        } GROUP BY ?cGrouped ?p ?od ?endpoint
    }
    BIND(?cGrouped AS ?c)
} GROUP BY ?c ?p ?od
```

## Commands to run the script and generate the configuration file

### Run the script
#### Dev mode
```bash
npm run devrun
```

#### Prod mode
```bash
npm run run
```

### Generate the configuration file
Test with [watdiv-docker](https://github.com/MaillPierre/watdiv-docker/tree/master).
```bash
sudo docker run --rm -it -v $(pwd)/input/:/input -v $(pwd)/output/:/output watdiv -m /input/watdiv_config.txt
```
