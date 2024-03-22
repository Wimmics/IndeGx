# Questions and associated properties

This file presents the questions asked to KGs, sorted by their associated tag. The *preferred properties* column shows a list of properties that can be used to answer the question. The properties must be associated with the URI of the KG. Unless otherwise specified, it is sufficient to provide at least one of them. Other properties can also be accepted, see the files in [rules/](../rules/).

The following namespace prefixes are used:
| Prefix | Namespace |
|---|---|
| dataid | http://dataid.dbpedia.org/ns/core# |
| dcat | http://www.w3.org/ns/dcat# |
| dce | http://purl.org/dc/elements/1.1/ |
| dct | http://purl.org/dc/terms/ |
| dqv | http://www.w3.org/ns/dqv# |
| foaf | http://xmlns.com/foaf/0.1/ |
| pav | http://purl.org/pav/ |
| prov | http://www.w3.org/ns/prov# |
| schema | http://schema.org/ |
| void | http://rdfs.org/ns/void# |

## Data Collection

<table>
<thead><tr>
<th>Tags</th> <th>Keywords</th> <th>Questions</th> <th>Preferred properties</th>
</tr></thead>
<tbody>
<tr>
<td>Collection. Who</td>
<td>Creators</td>
<td>Who are the creators of the KG and their role in this process? For all creators, indicates whether they are a person or an organization, provide information to identify them (name and point of contact such as email, or phone number, or address, or homepage), provide their qualifications, provide all characteristics which could have an influence on the KG.</td>
<td>dct:creator <br> dce:creator <br> schema:creator <br> schema:author <br> schema:contributor <br> foaf:maker <br> pav:createdBy <br> pav:authoredBy <br> <em>+ more details expected on creators</em></td>
</tr>
<tr>
<td>Collection. When</td>
<td>Creation date</td>
<td>What is/are the creation date(s) of the KG?</td>
<td>dct:created <br> prov:generatedAtTime <br> schema:dateCreated <br> pav:createdOn <br> pav:curatedOn</td>
</tr>
<tr>
<td rowspan="2">Collection. Where</td>
<td>Sources</td>
<td>From what original source(s) were the data collected or derived?</td>
<td>dct:source <br> dce:source <br> prov:wasDerivedFrom <br> prov:hadPrimarySource <br> pav:derivedFrom <br> pav:importedFrom <br> pav:retrievedFrom <br> schema:isBasedOn</td>
</tr>
<tr>
<td>Creation location</td>
<td>From what physical location (state, country, continent, ...) was the KG created?</td>
<td>schema:locationCreated <br> pav:createdAt</td>
</tr>
<tr>
<td>Collection. How</td>
<td>Creation methods</td>
<td>Which methods or tools were used for data creation?</td>
<td>dct:accrualMethod <br> pav:createdWith</td>
</tr>
</tbody>
</table>


## Data Maintenance

<table>
<thead><tr>
<th>Tags</th> <th>Keywords</th> <th>Questions</th> <th>Preferred properties</th>
</tr></thead>
<tbody>
<tr>
<td>Maintenance. Who</td>
<td>Contributors</td>
<td>Who are the maintainers of the KG and their role in this process? For all maintainers, indicates whether they are a person or an organization, provide information to identify them (name and point of contact such as email, or phone number, or address, or homepage), provide their qualifications, provide all characteristics which could have an influence on the KG.</td>
<td>dct:contributor <br> dce:contributor <br> schema:contributor <br> schema:maintainer <br> pav:contributedBy <br> <em>+ more details expected on contributors</em></td>
</tr>
<tr>
<td rowspan="2">Maintenance. When</td>
<td>Modification date</td>
<td>When was the KG last maintained/modified?</td>
<td>dct:modified <br> schema:dateModified <br> pav:lastUpdateOn</td>
</tr>
<tr>
<td>Modification frequency</td>
<td>With which frequency is the KG maintained?</td>
<td>dct:accrualPeriodicity</td>
</tr>
<tr>
<td>Maintenance. Where</td>
<td>Modification location</td>
<td>From what physical location (state, country, continent, ...) is or will the KG be maintained?</td>
<td>prov:wasGeneratedBy <br>/prov:atLocation</td>
</tr>
<tr>
<td>Maintenance. How</td>
<td>Modification method</td>
<td>What will be the methodology/ procedure for data maintenance?</td>
<td>dct:accrualMethod</td>
</tr>
</tbody>
</table>


## Data Usage

<table>
<thead><tr>
<th>Tags</th> <th>Keywords</th> <th>Questions</th> <th>Preferred properties</th>
</tr></thead>
<tbody>
<tr>
<td rowspan="3">Usage. Who</td>
<td>Publishers</td>
<td>Who publishes this KG?</td>
<td>dct:publisher <br> dce:publisher <br> schema:publisher</td>
</tr>
<tr>
<td>Usage rights</td>
<td>Who has the right to use the published KG?</td>
<td>dct:accessRights <br> dataid:openness <br> dct:license <br> schema:license</td>
</tr>
<tr>
<td>Audience</td>
<td>Who is intended to use the published KG?</td>
<td>dct:audience <br> schema:audience <br> dataid:usefulness</td>
</tr>
<tr>
<td rowspan="3">Usage. When</td>
<td>Start of availability</td>
<td>Since when was the KG available?</td>
<td>dct:issued <br> dct:available <br> schema:datePublished</td>
</tr>
<tr>
<td>End of availability</td>
<td>Until when is the KG available?</td>
<td>prov:invalidatedAtTime <br> schema:expires</td>
</tr>
<tr>
<td>End of validity</td>
<td>Until when is the KG valid?</td>
<td>dct:valid <br> schema:expires</td>
</tr>
<tr>
<td rowspan="3">Usage. Where</td>
<td>Webpage</td>
<td>What is the webpage presenting the KG and/or allowing to gain access to it?</td>
<td>foaf:homepage <br> dcat:landingPage</td>
</tr>
<tr>
<td>Endpoint or dump URL</td>
<td>Where to access the KG (either through a dump or a SPARQL endpoint)?</td>
<td>void:sparqlEndpoint <br> void:dataDump <br> schema:contentURL</td>
</tr>
<tr>
<td>Usage location</td>
<td>In what physical location can the KG be used?</td>
<td>dct:accessRights <br> dataid:openness <br> dct:license <br> schema:license</td>
</tr>
<tr>
<td rowspan="4">Usage. How</td>
<td>License</td>
<td>What is the license of the KG?</td>
<td>dct:license <br> schema:license</td>
</tr>
<tr>
<td>Endpoint or dump URL</td>
<td>How to access the KG? Provide a SPARQL endpoint or a dump if they are freely accessible, or the procedure of access, and the characteristics of the endpoint if provided.</td>
<td>void:sparqlEndpoint <br> void:dataDump <br> schema:contentURL <br> <em>+ more details expected on the SPARQL endpoint</em></td>
</tr>
<tr>
<td>Usage information</td>
<td>How to use, reuse or integrate the KG?</td>
<td>dataid:reuseAndIntegration</td>
</tr>
<tr>
<td>Usage requirements</td>
<td>What are the requirements to use the KG?</td>
<td>dcat:distribution/ dataid:softwareRequirement</td>
</tr>
<tr>
<td rowspan="7">Usage. What</td>
<td>Examples</td>
<td>What are examples of the published data?</td>
<td>void:exampleResource <br> schema:workExample</td>
</tr>
<tr>
<td>Concepts</td>
<td>What concepts, topics or subjects does the KG cover?</td>
<td>dct:subject <br> dce:subject <br> foaf:topic <br> foaf:primaryTopic <br> schema:about <br> schema:keywords <br> dcat:theme <br> dcat:keyword</td>
</tr>
<tr>
<td>Description</td>
<td>What is a general description of the KG?</td>
<td>dct:description <br> dce:description <br> schema:description <br> dataid:dataDescription</td>
</tr>
<tr>
<td>Triples</td>
<td>How many triples are there in the KG?</td>
<td>void:triples</td>
</tr>
<tr>
<td>Entities, properties, classes</td>
<td>How many entities, properties and classes are there in the KG?</td>
<td>void:entities <br> void:properties <br> void:classes</td>
</tr>
<tr>
<td>Serialization</td>
<td>What RDF serialization formats does the KG support?</td>
<td>void:feature <br> dct:format <br> dce:format <br> schema:encodingFormat</td>
</tr>
<tr>
<td>Quality</td>
<td>What is the quality of the KG?</td>
<td>dqv:hasQualityMeasurement <br> dqv:hasQualityAnnoation <br> schema:award <br> schema:review</td>
</tr>
</tbody>
</table>
