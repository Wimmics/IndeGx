# Note for experiments

## Queries

### Query to extract the results with one leaf measure per line

```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sin: <http://www.exemple.com/sin#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX earl: <http://www.w3.org/ns/earl#>

SELECT DISTINCT ?kge ?mlab (xsd:decimal(?value) AS ?val) ?endpoint
WHERE {
  GRAPH ?kgGraph {
   ?endpointDescription sd:endpoint ?endpoint ;
      a sd:Service, dcat:DataService , prov:Entity , earl:TestSubject ;
      dcat:servesDataset ?kge .
   ?kg prov:wasDerivedFrom ?kge ;
      dqv:hasQualityMeasurement ?measurement .
   ?measurement dqv:isMeasurementOf ?metric ;
      dqv:value ?value .
   ?metric rdfs:label ?mlab .
}
  GRAPH ?measureGraph {
   ?question sin:isImplementedBy ?metric .
   ?tagging sin:questionTagged ?question ;
      sin:tagWith ?leaf_tag .
  }
} ORDER BY ?kge ?mlab
```

### Query to extract the results for each KG and the results of all leaf measures

```sparql
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sin: <http://www.exemple.com/sin#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX earl: <http://www.w3.org/ns/earl#>

SELECT DISTINCT ?endpoint 
    ?kge 
    (xsd:decimal(?valuemeasure_maintenance_who) AS ?measure_maintenance_who) 
    (xsd:decimal(?valuemaintenance_frequency) AS ?maintenance_frequency) 
    (xsd:decimal(?valuemaintenance_location) AS ?maintenance_location) 
    (xsd:decimal(?valuemaintenance_methodology) AS ?maintenance_methodology) 
    (xsd:decimal(?valuemodification_date) AS ?modification_date) 
    (xsd:decimal(?valueusage_audience) AS ?usage_audience) 
    (xsd:decimal(?valueusage_publisher) AS ?usage_publisher) 
    (xsd:decimal(?valueusage_rights) AS ?usage_rights) 
    (xsd:decimal(?valueusage_dateEndAvailability) AS ?usage_dateEndAvailability) 
    (xsd:decimal(?valueusage_dateEndValidity) AS ?usage_dateEndValidity) 
    (xsd:decimal(?valueusage_dateStartAvailability) AS ?usage_dateStartAvailability) 
    (xsd:decimal(?valueusage_serialization) AS ?usage_serialization) 
    (xsd:decimal(?valueusage_concepts) AS ?usage_concepts) 
    (xsd:decimal(?valueusage_description) AS ?usage_description) 
    (xsd:decimal(?valueusage_entitiesPropertiesClasses) AS ?usage_entitiesPropertiesClasses) 
    (xsd:decimal(?valueusage_quality) AS ?usage_quality) 
    (xsd:decimal(?valueusage_triples) AS ?usage_triples) 
    (xsd:decimal(?valueusage_examples) AS ?usage_examples) 
    (xsd:decimal(?valueusage_license) AS ?usage_license) 
    (xsd:decimal(?valueusage_requirements) AS ?usage_requirements) 
    (xsd:decimal(?valueusage_reuse) AS ?usage_reuse) 
    (xsd:decimal(?valuemeasure_usage_how) AS ?measure_usage_how) 
    (xsd:decimal(?valueusage_location) AS ?usage_location) 
    (xsd:decimal(?valueusage_webpage) AS ?usage_webpage) 
    (xsd:decimal(?valueusage_address) AS ?usage_address) 
    (xsd:decimal(?valuemeasure_creator_who) AS ?measure_creator_who) 
    (xsd:decimal(?valuecreation_date) AS ?creation_date) 
    (xsd:decimal(?valuecreation_location) AS ?creation_location) 
    (xsd:decimal(?valuecreation_methodology) AS ?creation_methodology) 
    (xsd:decimal(?valuecreation_source) AS ?creation_source)
WHERE {
    GRAPH ?kgGraph {
        ?endpointDescription sd:endpoint ?endpoint ;
            a sd:Service, dcat:DataService , prov:Entity , earl:TestSubject ;
            dcat:servesDataset ?kge .
        ?kg prov:wasDerivedFrom ?kge ;
            dqv:hasQualityMeasurement ?measurement1, ?measurement2, ?measurement3, ?measurement4, ?measurement5, ?measurement6, ?measurement7, ?measurement8, ?measurement9, ?measurement10, ?measurement11, ?measurement12, ?measurement13, ?measurement14, ?measurement15, ?measurement16, ?measurement17, ?measurement18, ?measurement19, ?measurement20, ?measurement21, ?measurement22, ?measurement23, ?measurement24, ?measurement25, ?measurement26, ?measurement27, ?measurement28, ?measurement29, ?measurement30 .

        ?measurement1 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/score_computing_rules/measure_maintenance_who.ttl> ;
            dqv:value ?valuemeasure_maintenance_who .
        ?measurement2 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/maintenance/maintenance_frequency.ttl> ;
            dqv:value ?valuemaintenance_frequency .
        ?measurement3 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/maintenance/maintenance_location.ttl> ;
            dqv:value ?valuemaintenance_location .
        ?measurement4 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/maintenance/maintenance_methodology.ttl> ;
            dqv:value ?valuemaintenance_methodology .
        ?measurement5 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/maintenance/modification_date.ttl> ;
            dqv:value ?valuemodification_date .

        ?measurement6 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/who/usage_audience.ttl> ;
            dqv:value ?valueusage_audience .
        ?measurement7 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/who/usage_publisher.ttl> ;
            dqv:value ?valueusage_publisher .
        ?measurement8 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/who/usage_rights.ttl> ;
            dqv:value ?valueusage_rights .

        ?measurement9 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/when/usage_dateEndAvailability.ttl> ;
            dqv:value ?valueusage_dateEndAvailability .
        ?measurement10 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/when/usage_dateEndValidity.ttl> ;
            dqv:value ?valueusage_dateEndValidity .
        ?measurement11 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/when/usage_dateStartAvailability.ttl> ;
            dqv:value ?valueusage_dateStartAvailability .

        ?measurement12 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_serialization.ttl> ;
            dqv:value ?valueusage_serialization .
        ?measurement13 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_concepts.ttl> ;
            dqv:value ?valueusage_concepts .
        ?measurement14 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_description.ttl> ;
            dqv:value ?valueusage_description .
        ?measurement15 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_entitiesPropertiesClasses.ttl> ;
            dqv:value ?valueusage_entitiesPropertiesClasses .
        ?measurement16 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_quality.ttl> ;
            dqv:value ?valueusage_quality .
        ?measurement17 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_triples.ttl> ;
            dqv:value ?valueusage_triples .
        ?measurement18 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/what/usage_examples.ttl> ;
            dqv:value ?valueusage_examples .

        ?measurement19 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/how/usage_license.ttl> ;
            dqv:value ?valueusage_license .
        ?measurement20 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/how/usage_requirements.ttl> ;
            dqv:value ?valueusage_requirements .
        ?measurement21 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/how/usage_reuse.ttl> ;
            dqv:value ?valueusage_reuse .
        ?measurement22 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/score_computing_rules/measure_usage_how.ttl> ;
            dqv:value ?valuemeasure_usage_how .

        ?measurement23 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/where/usage_location.ttl> ;
            dqv:value ?valueusage_location .
        ?measurement24 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/where/usage_webpage.ttl> ;
            dqv:value ?valueusage_webpage .
        ?measurement25 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/usage/where/usage_address.ttl> ;
            dqv:value ?valueusage_address .

        ?measurement26 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/score_computing_rules/measure_creator_who.ttl> ;
            dqv:value ?valuemeasure_creator_who .
        ?measurement27 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/creation/creation_date.ttl> ;
            dqv:value ?valuecreation_date .
        ?measurement28 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/creation/creation_location.ttl> ;
            dqv:value ?valuecreation_location .
        ?measurement29 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/creation/creation_methodology.ttl> ;
            dqv:value ?valuecreation_methodology .
        ?measurement30 dqv:isMeasurementOf <https://raw.githubusercontent.com/Jendersen/KG_accountability/main/rules/creation/creation_source.ttl> ;
            dqv:value ?valuecreation_source .
    }
    GRAPH ?measureGraph {
        ?question sin:isImplementedBy ?metric .
        ?tagging sin:questionTagged ?question ;
            sin:tagWith ?leaf_tag .
    }
} ORDER BY ?kge ?mlab
```
