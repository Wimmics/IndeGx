# Generation of a WATdiv configuration file from statistics extracted from dataset descriptions

This script generates a WATdiv configuration file from statistics extracted from dataset descriptions.
The configuration will generate dataset description that will be used to describe the dataset of a fictive shop in the setting of FedShop. Each shop will correspond to one dataset. Each dataset will be described by a dataset description containing informations about the shop in the same proportion as the descriptions found in datasets available online.

## Limitations set on the dataset description
The classes and properties will be limited to the those that are both:
- used in dataset descriptions online
- defined by Linked Open Vocabulary (LOV) ontologies
- appear in more than one dataset description

As watdiv do not make it possible to define entities that are instances of several classes, we will only declare and instance of dcat:Dataset at the root of the dataset description. dcat:Dataset is the class the most often used to type the resource describing a dataset. 

## Queries used to extract statistics

### Number of datasets

```sparql
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT (COUNT(DISTINCT ?dataset) AS ?countAllDataset) {
    {
        SELECT DISTINCT ?dataset  {
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
        }
    }
}
```
Result: 2615

### Number of instances of classes in dataset descriptions

Used in [class_instances_MinMaxAverageOccurences_NbDataset.csv](class_instances_MinMaxAverageOccurences_NbDataset.csv)

```sparql
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?c (MIN(?count) AS ?minCount) (MAX(?count) AS ?maxCount) (ROUND(AVG(?count)) as ?avgCount) (COUNT(DISTINCT ?dataset) as ?countDataset) {
    GRAPH ?endpoint {
        ?endpoint dcat:servesDataset ?dataset
    }
    GRAPH ?datasetGraph {
    	?dataset ?p ?o .
    	?o a ?c .
    }
    ?dataset void:classPartition ?classPartition .
    ?classPartition void:inDataset ?dataset ;
        void:class ?c ;
        void:entities ?count .
    FILTER(?c != void:Dataset && ?c != dcat:Dataset  && ?c != dctype:Dataset  && ?c != sd:Dataset  && ?c != schema:Dataset  && ?c != dct:Dataset  && ?c != owl:Class && ?c != rdfs:Class)
} GROUP BY ?c
```

### Association of classes and properties to datasets

#### Properties and types of objects appearing around instances, with min, max and average number of occurrences in a dataset. Instances of dataset classes are grouped together into dcat:Dataset
Used in [class_property_object-class_MinMaxAverage_NbDatasets.csv](class_property_object-class_MinMaxAverage_NbDatasets.csv)

```sparql
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?c ?p ?oc (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (COUNT(DISTINCT ?dataset) AS ?countAllDataset) {
    {
        SELECT ?cGrouped ?p ?ocGrouped (MIN(?cpoccount) AS ?minC) (MAX(?cpoccount) AS ?maxC) (AVG(?cpoccount) AS ?average) ?dataset {
            {
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
            }
            BIND(IF((?c = dcat:Dataset || ?c = void:Dataset || ?c = dcmitype:Dataset || ?c = schema:Dataset || ?c = sd:Dataset || ?c = dataid:Dataset ), dcat:Dataset, ?c ) AS ?cGrouped)
            BIND(IF((?oc = dcat:Dataset || ?oc = void:Dataset || ?oc = dcmitype:Dataset || ?oc = schema:Dataset || ?oc = sd:Dataset || ?oc = dataid:Dataset ), dcat:Dataset, ?oc ) AS ?ocGrouped)
        } GROUP BY ?cGrouped ?p ?ocGrouped ?dataset
    }
    BIND(?cGrouped AS ?c)
    BIND(?ocGrouped AS ?oc)
} GROUP BY ?c ?p ?oc 
```

#### Properties and datatypes of objects appearing around instances of DATASET classes, with min, max and average number of occurrences in a dataset
Used in [class_property_object-datatype_MinMaxAverageOccurrences_MinMaxValues_NbDatasets.csv](class_property_object-datatype_MinMaxAverageOccurrences_MinMaxValues_NbDatasets.csv)

```sparql
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX schema: <http://schema.org/>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dctype: <http://purl.org/dc/dcmitype/>
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT DISTINCT ?c ?p ?od (MIN(?minC) AS ?minAllC) (MAX(?maxC) AS ?maxAllC) (ROUND(AVG(?average)) AS ?averageAll) (MIN(?minValue) AS ?minValueAll) (MAX(?maxValue) as ?maxValueAll) (COUNT(DISTINCT ?dataset) AS ?countAllDataset) {
    {
        SELECT DISTINCT ?cGrouped ?p ?od (MIN(?cpodcount) AS ?minC) (MAX(?cpodcount) AS ?maxC) (AVG(?cpodcount) AS ?average) (MIN(?min) AS ?minValue) (MAX(?max) as ?maxValue) ?dataset {
            {
                SELECT DISTINCT ?dataset ?c ?p ?od ?cpodcount ?min ?max {
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
                        void:datatype ?od ;
                        void:entities ?cpodcount .
                    OPTIONAL {
                        ?objectDatatypePartition kgi:minimum ?min ;
                        kgi:maximum ?max .
                    }
                } GROUP BY ?dataset ?c ?p ?od ?cpodcount ?min ?max
            }
          	BIND(IF((?c = dcat:Dataset || ?c = void:Dataset || ?c = dcmitype:Dataset || ?c = schema:Dataset || ?c = sd:Dataset || ?c = dataid:Dataset ), dcat:Dataset, ?c ) AS ?cGrouped)
        } GROUP BY ?cGrouped ?p ?od ?dataset
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
```bash
sudo docker run --rm -it -v $(pwd)/input/:/input -v $(pwd)/output/:/output watdiv -m /input/watdiv_config.txt
```