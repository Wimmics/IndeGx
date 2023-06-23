# Post-treatment rules for IndeGx

Post-treatment rules are rules that are applied of the KG resulting of the extraction by IndeGx from each endpoint. Their goal is to allow comparisons between KG descriptions and the enrichment of KG descriptions according to what was extracted.

The usage of `$rawEndpointUrl` is discouraged in those rules as its value is the inner docker adress for the corese server. Other that this consideration, post-treament rules are defined as any other extraction rule for IndeGx, as presented in the [`rules` folder](../rules/README.md).

## Equivalences rules

[Equivalences rules](./equivalences/) are rules that try to saturate the descriptions of KG with the addition of every known equivalence of classes and properties that can be used to describe a KG.

## Redundancy rules

[Redundancy rules](./redundancy/) are rules that exploit the redundancy between elements extracted by IndeGx rule to complete potential missing information. Mainly, they use the summary of a KG to complete the property and namespace partition where necessary.

## Inclusion rules

[Inclusion rules](./inclusion/) are a work in progress. Their goal is to test the description of KGs progressively to determine if they are equivalent or one is included in another and to which degree.

## Performance rules

[WIP](./performance/)
