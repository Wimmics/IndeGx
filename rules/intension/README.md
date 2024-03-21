# IndeGx rules based on OWL RL reasoning

Thisq set of rules is intended to add information in the data retrieved by IndeGx to annotate datasets and endpoints description with additional information.

## Accountability

### Classes
TODO: List of classes used and what they mean

### Queries to retrieve the corresponding information

```sparql
PREFIX kgi: <http://ns.inria.fr/kg/index#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?dataset {
    {
        ?dataset a kgi:PartiallyAccountable
    } UNION {
        ?dataset a ?class .
        ?class rdfs:isDefinedBy kgi: .
    }
}
```