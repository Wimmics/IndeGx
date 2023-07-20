# FAIR-Checker evaluation reimplementation

Extract the list of kgs and the measures they have been evaluated with.

```sparql
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX schema: <http://schema.org/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?endpointUrl ?kg ?measure ?value WHERE {
    GRAPH ?kgGraph {
        ?kg dqv:hasQualityMeasurement ?measurement .
        
        ?measurement a dqv:QualityMeasurement ;
            dqv:isMeasurementOf ?measure ;
            dqv:value ?value .
        
        { ?kg a dcat:Dataset }
        UNION { ?kg a void:Dataset }
        UNION { ?kg a dcmitype:Dataset }
        UNION { ?kg a schema:Dataset }
        UNION { ?kg a sd:Dataset }
        UNION { ?kg a dataid:Dataset }

        { ?kg ?endpointLink ?endpointUrl . 
            VALUES ?endpointLink {
                dcat:endpointURL
                void:sparqlEndpoint
                sd:endpoint
                dcat:accessURL
            }
        }
        UNION {?kg dcat:accessService ?service .
            ?service dcat:endpointURL ?endpointUrl .  }
        UNION {?kg dcat:accessService ?service .
            ?service sd:endpoint ?endpointUrl . }
        UNION {?service dcat:servesDataset ?kg .
            ?service dcat:endpointURL ?endpointUrl . }
        UNION {?service dcat:servesDataset ?kg .
            ?service sd:endpoint ?endpointUrl . }
    }
}
```

Extract the list of the values of the evaluation for each KG.

```sparql
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX schema: <http://schema.org/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?endpointUrl ?kg  ?measureF1A ?measureF1B ?measureF2A ?measureF2B ?measureA11 ?measureA12 ?measureI1 ?measureI2 ?measureI3 ?measureR11 ?measureR12 ?measureR13 WHERE {
    GRAPH ?kgGraph {
        ?kg dqv:hasQualityMeasurement ?measurementF1A, ?measurementF1B, ?measurementF2A, ?measurementF2B, ?measurementA11, ?measurementA12, ?measurementI1, ?measurementI2, ?measurementI3, ?measurementR11, ?measurementR12, ?measurementR13 .
        
        ?measurementF1A a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/F1#F1A> ;
            dqv:value ?measureF1A .
            
        ?measurementF1B a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/F1#F1B> ;
            dqv:value ?measureF1B .
            
        ?measurementF2A a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/F2#F2A> ;
            dqv:value ?measureF2A .
            
        ?measurementF2B a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/F2#F2B> ;
            dqv:value ?measureF2B .
            
        ?measurementA11 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/A1#A11> ;
            dqv:value ?measureA11 .
            
        ?measurementA12 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/A1#A12> ;
            dqv:value ?measureA12 .
            
        ?measurementI1 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I1> ;
            dqv:value ?measureI1 .
            
        ?measurementI2 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I2> ;
            dqv:value ?measureI2 .
            
        ?measurementI3 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I3> ;
            dqv:value ?measureI3 .
            
        ?measurementR11 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/R1#R11> ;
            dqv:value ?measureR11 .
            
        ?measurementR12 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/R1#R12> ;
            dqv:value ?measureR12 .
            
        ?measurementR13 a dqv:QualityMeasurement ;
            dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/R1#R13> ;
            dqv:value ?measureR13 .
        
        { ?kg a dcat:Dataset }
        UNION { ?kg a void:Dataset }
        UNION { ?kg a dcmitype:Dataset }
        UNION { ?kg a schema:Dataset }
        UNION { ?kg a sd:Dataset }
        UNION { ?kg a dataid:Dataset }

        { ?kg ?endpointLink ?endpointUrl . 
            VALUES ?endpointLink {
                dcat:endpointURL
                void:sparqlEndpoint
                sd:endpoint
                dcat:accessURL
            }
        }
        UNION {?kg dcat:accessService ?service .
            ?service dcat:endpointURL ?endpointUrl .  }
        UNION {?kg dcat:accessService ?service .
            ?service sd:endpoint ?endpointUrl . }
        UNION {?service dcat:servesDataset ?kg .
            ?service dcat:endpointURL ?endpointUrl . }
        UNION {?service dcat:servesDataset ?kg .
            ?service sd:endpoint ?endpointUrl . }
    }
}
```

Endpoint list

```sparql
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX schema: <http://schema.org/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?endpointUrl WHERE {
    {
        ?kg ?endpointLink ?endpointUrl . 
        VALUES ?endpointLink {
            dcat:endpointURL
            void:sparqlEndpoint
            sd:endpoint
            dcat:accessURL
        }
    } UNION {
        GRAPH ?kgGraph {
            ?kg ?endpointLink ?endpointUrl . 
            VALUES ?endpointLink {
                dcat:endpointURL
                void:sparqlEndpoint
                sd:endpoint
                dcat:accessURL
            }
        }
    }
}
```