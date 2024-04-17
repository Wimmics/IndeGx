# List of equivalences between properties (and patterns)

This file contains the equivalences used to saturate the datasets descriptions. In case of doubt about how to read some patterns, the actual equivalences can be read in [this file](/nonTrivialExtractionRules/_manifest.ttl).
The equivalences presented here are dedicated to the evaluation of Dataset Accountability. Some properties may not be considered equivalent in other contexts. Also, the domain and range of the properties have not been taken into account here.

The following namespace prefixes are used:
| Prefix | Namespace | Prefix | Namespace |
|---|---|---|---|
| adms | http://www.w3.org/ns/adms# | nie | http://www.semanticdesktop.org/ontologies/2007/01/19/nie# |
| cc | http://creativecommons.org/ns# | pav | http://purl.org/pav/ |
|     dataid    | http://dataid.dbpedia.org/ns/core# | powder-s | http://www.w3.org/2007/05/powder-s# |
|     dcat    | http://www.w3.org/ns/dcat# | prov | http://www.w3.org/ns/prov# |
| dce | http://purl.org/dc/elements/1.1/ | rdfs | http://www.w3.org/2000/01/rdf-schema# |
|     dcmitype    | http://purl.org/dc/dcmitype/ |     schema    | http://schema.org/ |
|  dct | http://purl.org/dc/terms/ |     sd    | http://www.w3.org/ns/sparql-service-description# |
| doap | http://usefulinc.com/ns/doap# | skos | http://www.w3.org/2004/02/skos/core# |
| dqv | http://www.w3.org/ns/dqv# | sto | https://w3id.org/i40/sto# |
| foaf | http://xmlns.com/foaf/0.1/ |     void    | http://rdfs.org/ns/void# |
| owl | http://www.w3.org/2002/07/owl# | xhv | http://www.w3.org/1999/xhtml/vocab# |

The equivalences are detailed here:
| Property identifier | Equivalent properties (or patterns) |
|--|--|
|Class Dataset |dcat:Dataset<br>void:Dataset<br>dcmitype:Dataset<br>schema:Dataset<br>sd:Dataset<br>dataid:Dataset |
|accessStatement |dce:rights<br> dct:rights<br> dct:accessRights |
|alternativeTitle |schema:alternateName<br> dct:alternative<br>skos:altLabel |
|audience | dct:audience<br>schema:audience<br>dataid:usefulness |
|creationDate | dct:created<br>schema:dateCreated<br>pav:createdOn<br>prov:generatedAtTime<br>prov:wasGeneratedBy/(prov:startedAtTime\|prov:endedAtTime) |
|creationLocation |schema:locationCreated<br>pav:createdAt<br>prov:wasGeneratedBy/prov:atLocation |
|creationMethod |pav:createdWith<br>pav:retrievedBy<br>pav:importedBy<br>prov:wasGeneratedBy/prov:wasAssociatedWith/a prov:SoftwareAgent + constraints on type of activity |
|creator |dce:creator<br> dct:creator<br>foaf:maker<br>schema:creator<br>pav:createdBy<br>schema:author<br>pav:authoredBy<br>prov:wasGeneratedBy/prov:wasAssociatedWith/prov:actedOnBehalfOf\*/a [Person/Organization]  + constraints on type of activity|
|description |rdfs:comment<br>dce:description<br> dct:description<br>schema:description<br>dataid:dataDescription<br>owl:comment<br>skos:note<br>powder-s:text |
|distribution |schema:distribution<br>dcat:distribution |
|dump |void:dataDump<br>dcat:distribution/dcat:downloadURL<br>schema:distribution/schema:contentUrl |
|editor |dce:contributor<br> dct:contributor<br>schema:contributor<br>pav:contributedBy<br>schema:editor<br>prov:wasGeneratedBy/prov:wasAssociatedWith/prov:actedOnBehalfOf\*/a [Person/Organization]  + constraints on type of activity |
|endAvailability |schema:expires<br>prov:invalidatedAtTime |
|endValidity | dct:valid<br>schema:expires |
|examples |schema:workExample<br>void:exampleResource<br>skos:example |
|identifier |schema:identifier<br>dce:identifier<br> dct:identifier<br>adms:identifier |
|keyword |schema:keywords<br>dcat:keyword |
|language |schema:inLanguage<br> dct:language |
|license |<br> dct:license<br>schema:license<br>schema:sdLicense<br>doap:license<br>cc:license<br>xhv:license<br>sto:license<br>nie:license |
|modificationDate | dct:modified<br>schema:dateModified<br>pav:lastUpdateOn<br>pav:contributedOn<br>prov:wasGeneratedBy/prov:startedAtTime\|prov:endedAtTime |
|modificationMethod |prov:wasGeneratedBy/prov:wasAssociatedWith/a prov:SoftwareAgent + constraints on type of activity |
|otherPages |schema:relatedLink<br>rdfs:seeAlso |
|otherVersion | dct:isVersionOf<br>pav:previousVersion<br>owl:priorVersion |
|publicationDate | dct:issued<br> dct:available<br>schema:datePublished<br>schema:sdDatePublished<br>prov:wasGeneratedBy/prov:startedAtTime\|prov:endedAtTime + activity a prov:Publish |
|publicationReferences|schema:publication<br> dct:references |
|publisher |dce:publisher<br> dct:publisher<br>schema:publisher<br>schema:sdPublisher<br>pav:providedBy<br>prov:wasGeneratedBy/prov:wasAssociatedWith/prov:actedOnBehalfOf\*a [Person/Organization]   + activity a prov:Publish |
|qualityAnnotation |schema:review<br>dqv:hasQualityAnnotation |
|serialization |dce:format<br> dct:format<br>schema:encodingFormat<br>void:feature |
|source |dce:source<br> dct:source<br>schema:isBasedOn<br>pav:derivedFrom<br>pav:importedFrom<br>pav:retrievedFrom<br>prov:wasDerivedFrom<br>prov:hadPrimarySource |
|sparqlEndpoint |schema:contentURL<br>void:sparqlEndpoint<br>dcat:accessService/dcat:endpointURL<br>dcat:accessService/sd:endpoint<br>?s dcat:servesDataset ?kg . ?s dcat:endpointURL ?url .<br>?s dcat:servesDataset ?kg . ?s sd:endpoint ?url . |
|spatialCoverage |schema:spatialCoverage<br> dct:spatial |
|temporalCoverage |schema:temporalCoverage<br> dct:temporal |
|title |schema:name<br>dce:title<br> dct:title<br>rdfs:label |
|topic |dce:subject<br> dct:subject<br>foaf:topic<br>foaf:primaryTopic<br>schema:about<br>dcat:theme |
|version |schema:version<br> dct:hasVersion<br>dcat:version<br>pav:version<br>pav:hasCurrentVersion |
|versionNotes |adms:versionNotes<br>owl:versionInfo |
|vocabularies | dct:conformsTo<br>void:vocabulary |
|webpage |foaf:homepage<br>schema:url<br>dcat:landingPage<br>dcat:distribution/dcat:accessURL |