# IndeGx application, Docker + Corese + NodeJs/Typescript version

## Description
This repository hosts the new version of the IndeGx application. This new version will be a Typescript application interfaced with a Corese server instance, both encapsulated in a Docker image. The generation rules are rewritten to be more consistent in the form of SPARQL Update queries sent to the Corese server. 

## Ameliorations
Ths new version of IndeGx has new advantages compared to the previous one in the DeKaLoG repository:
- Treatment of endpoints in parallel
- The asserted and computed elements of a knowledge base description are now separated into different graphs. Each description now consists in 3 graphs for one KB.
- Usage of Corese advanced features such as the pagination of the results of federated queries to retrive more complete results

## Commands


### Development
Compilation:
`npx tsc`

Execution:
`node src/Indegx.js`

Starting the Corese server:
`npm run start`

Developpement build:
`npm run build`

Compile and run
`npm run devrun`

Run
`npm run run`
