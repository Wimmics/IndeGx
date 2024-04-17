# Adaptation of the LiQuID questions to the context of Knowledge Graphs (KGs)

To see the required properties for each question, see [rules/](../rules/) folder for an exhaustive view, or [this file](questions_and_properties.md) for a more synthetic summary.

## Data Collection

| Tag | Questions from LiQuID | Questions adapted to KG |
|---|---|---|
| Collection. Why | Why was the data set created? | (1) |
| Collection. Who | Who (people, organizations) was involved in the data collection process? Provide all information relevant to their identification, their role in the data collection process, all information necessary to assess their qualifications to fulfill this role, and all characteristics which could have an influence on the data set. | Who are the creators of the KG and their role in this process? For all creators, indicates whether they are a person or an organization, provide information to identify them (name and point of contact such as email, or phone number, or address, or homepage), provide their qualifications, provide all characteristics which could have an influence on the KG. |
| Collection. When | On what date(s) or time frame(s) has the data been collected/ created? It must also be possible to place the data in a temporal context. | What is/are the creation date(s) of the KG? |
| Collection. Where | Where was the data set collected (country, place, website, …)? It must also be possible to place the data in a spatial context. | From what original source(s) were the data collected or derived? |
| " | " | From what physical location (state, country, continent, ...) was the KG created? |
| Collection. How | What was the methodology/ procedure for data collection? | Which methods or tools were used for data creation? |
| " | Which methods and tools were exactly used in each step and what was the (technical) environment? | (2) |
| Collection. What | What data was collected? | (3) |
| " | What concepts does it cover? | (3) |
| " | What is a general description of the data set? | (3) |
| " | What are the characteristics/ profile of the data set (dependent on data type)? | (3) |
| " | What is the quality of the data set (quality metrics depend on data type)? | (3) |

## Data Maintenance

| Tag | Questions from LiQuID | Questions adapted to KG |
|---|---|---|
| Maintenance. Why | Why will the dataset be further maintained? | (1) |
| Maintenance. Who | Who (people, organizations) will be involved in the data maintenance? Provide all information relevant to their identification, their role in the data maintenance, all information necessary to assess their qualifications to fulfill this role, and all characteristics which could have an influence on the data set. | Who are the maintainers of the KG and their role in this process? For all maintainers, indicates whether they are a person or an organization, provide information to identify them (name and point of contact such as email, or phone number, or address, or homepage), provide their qualifications, provide all characteristics which could have an influence on the KG. |
| Maintenance. When | On what date(s) or time frame(s) will the data be maintained? | When was the KG last maintained/modified? |
| " | With which frequency? | With which frequency is the KG maintained? |
| Maintenance. Where | Where will the data set be maintained (country, place, website, ...)? | From what physical location (state, country, continent, ...) is or will the KG be maintained? |
| Maintenance. How | What will be the methodology/ procedure for data maintenance? | What will be the methodology/ procedure for data maintenance? |
| " | Which methods and tools will exactly be used in each step and what will be the (technical) environment? | (2) |
| Maintenance. What | What data will be the result of the data maintenance? | (3) |
| " | What concepts does it cover? | (3) |
| " | What is a general description of the data set? | (3) |
| " | What are the characteristics/ profile of the data set (dependent on data type)? | (3) |
| " | What is the quality of the data set (quality metrics depend on data type)?| (3) |

## Data Usage

| Tag | Questions from LiQuID | Questions adapted to KG |
|---|---|---|
| Usage. Why | What has the data set been used for? | (1) |
| " | For which other purposes can the published data set be used for? | (1) |
| Usage. Who | Who publishes this data set? | Who publishes this KG? |
| " | Who has used/ can use the published data set? | Who has the right to use the published KG? |
| " | " | Who is intended to use the published KG? |
| Usage. When | When can/ was the published data set be used? | Since when was the KG available? |
| " | When is it available? | Until when is the KG available? |
| " | Until what point in time is it valid? | Until when is the KG valid? |
| Usage. Where | Where is the data set published/ available? | What is the webpage presenting the KG and/or allowing to gain access to it? |
| " | " | Where to access the KG (either through a dump or a SPARQL endpoint)? |
| " | Where (place, geographically) can the published data set be used? | In what physical location can the KG be used? |
| Usage. How | What is a recommended process for using the published data set? | What is the license of the KG? |
| " | " | How to access the KG? Provide a SPARQL endpoint or a dump if they are freely accessible, or the procedure of access, and the characteristics of the endpoint if provided. |
| " | " | How to use, reuse or integrate the KG? |
| " | What are recommended methods, tools, and technical environments where the published data set can be used? | What are the requirements to use the KG? |
| Usage. What | What data is published for use? | What are examples of the published data? |
| " | What concepts does it cover? | What concepts, topics or subjects does the KG cover? |
| " | What is a general description of the data set? | What is a general description of the KG? |
| " | What are the characteristics/ profile of the data set (dependent on data type)? | How many triples are there in the KG? |
| " | " | How many entities, properties and classes are there in the KG? |
| " | " | What RDF serialization formats does the KG support? |
| " | What is the quality of the data set (quality metrics depend on data type)? | What is the quality of the KG? |


- (1) Vocabularies miss expressivity.
- (2) Question too complicated, it could be the subject of a whole need focused on provenance.
- (3) Vocabularies miss expressivity to distinguish between collected or maintained data and published data, so only the questions about published data are considered.
