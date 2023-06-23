import * as Sparql from "./SPARQLUtils.js"
import * as Log from "./LogUtils.js"
import * as Global from "./GlobalUtils.js"
import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';

const localEndpointUrl = "http://localhost:3030/FAIR-Checker/sparql"
const resultFilename = "results.json";

type ResultObject = {
    kg: string,
    endpointUrl: string,
    apiScore: any[],
    indegxScore: any[]
}

// Retrieve a list of KG URIs from IndeGx endpoint
const endpointQuery = `
PREFIX dataid: <http://dataid.dbpedia.org/ns/core#>
PREFIX sd: <http://www.w3.org/ns/sparql-service-description#>
PREFIX schema: <http://schema.org/>
PREFIX dcmitype: <http://purl.org/dc/dcmitype/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dqv: <http://www.w3.org/ns/dqv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?kg ?endpointUrl WHERE {
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
`;

function dataTreatment() {
    if (!fs.existsSync("results.json")) {
        return Sparql.sparqlQueryPromise(localEndpointUrl, endpointQuery).then((resultsObject) => {
            let resultsObjectArray: ResultObject[] = []
            resultsObject.results.bindings.forEach((binding) => {
                resultsObjectArray.push({ kg: binding.kg.value, endpointUrl: binding.endpointUrl.value, apiScore: [], indegxScore: [] })
            })
            return resultsObjectArray;
        }).then(resultsObjectArray => {

            // For each KG, retrieve their score through the FAIR Checker API
            let promisesArgsArray: any[][] = [];
            resultsObjectArray.forEach((resultObject) => {
                const APIQuery = "https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(resultObject.kg);
                promisesArgsArray.push([resultObject, APIQuery]);
            })
            function promiseFunction(resultObject: ResultObject, query: string) {
                return Global.fetchJSONPromise(query).then((APIResultObject: any[] | { message }) => {
                    let resultsIndex = resultsObjectArray.findIndex(tmpResult => tmpResult.kg === resultObject.kg && tmpResult.endpointUrl === resultObject.endpointUrl);
                    if (resultsIndex === -1) {
                        Log.error("Error: could not find the result object for", query);
                        return;
                    }
                    if (!Array.isArray(APIResultObject) && APIResultObject.message !== undefined) {
                        Log.error("Error: could not find the API result object for", query, "because of", APIResultObject.message);
                        return;
                    }
                    if (APIResultObject === undefined || !Array.isArray(APIResultObject) || APIResultObject.length === 0) {
                        Log.error("Error: could not find the API result object for", query);
                        return;
                    }
                    resultsObjectArray[resultsIndex].apiScore.push(APIResultObject);
                    return;
                })
            }

            return Global.iterativePromises(promisesArgsArray, promiseFunction, 1000).then(() => {
                return resultsObjectArray;
            })

        }).then((resultsObjectArray) => {

            // Compare the scores to the ones available in the Indegx endpoint
            const measureQuery = `
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
        }`

            return Sparql.sparqlQueryPromise(localEndpointUrl, measureQuery).then((results) => {
                results.results.bindings.forEach((binding) => {
                    let endpointUrl = binding.endpointUrl.value
                    let kg = binding.kg.value
                    let measureF1A = binding.measureF1A.value
                    let measureF1B = binding.measureF1B.value
                    let measureF2A = binding.measureF2A.value
                    let measureF2B = binding.measureF2B.value
                    let measureA11 = binding.measureA11.value
                    let measureA12 = binding.measureA12.value
                    let measureI1 = binding.measureI1.value
                    let measureI2 = binding.measureI2.value
                    let measureI3 = binding.measureI3.value
                    let measureR11 = binding.measureR11.value
                    let measureR12 = binding.measureR12.value
                    let measureR13 = binding.measureR13.value

                    if (!resultsObjectArray.find(tmpResult => tmpResult.kg === kg && tmpResult.endpointUrl === endpointUrl)) {
                        resultsObjectArray.push({
                            endpointUrl: endpointUrl,
                            kg: kg,
                            indegxScore: [],
                            apiScore: []
                        })
                    }

                    resultsObjectArray[resultsObjectArray.findIndex(tmpResult => tmpResult.kg === kg && tmpResult.endpointUrl === endpointUrl)].indegxScore.push({
                        "endpointUrl": endpointUrl,
                        "kg": kg,
                        "F1A": measureF1A,
                        "F1B": measureF1B,
                        "F2A": measureF2A,
                        "F2B": measureF2B,
                        "A1.1": measureA11,
                        "A1.2": measureA12,
                        "I1": measureI1,
                        "I2": measureI2,
                        "I3": measureI3,
                        "R1.1": measureR11,
                        "R1.2": measureR12,
                        "R1.3": measureR13
                    })
                })
            }).then(() => {
                return resultsObjectArray
            });

        }).then((resultsObjectArray) => {

            // Write the results to a file

            Global.writeFile(resultFilename, JSON.stringify(resultsObjectArray).replaceAll('"metric": null', '"metric": "I1"'))
            return resultsObjectArray;
        })
    } else {
        return fsPromises.readFile(resultFilename, 'utf8').then(fileContent => (JSON.parse(fileContent) as ResultObject[]))
    }
}

dataTreatment()
.then((resultsObjectArray) => {

    // Write the comparison results to a file
    let csvHeaders = [
        "Endpoint",
        "KG"
    ];
    const fairKeys = [
        "F1A",
        "F1B",
        "F2A",
        "F2B",
        "A1.1",
        "A1.2",
        "I1",
        "I2",
        "I3",
        "R1.1",
        "R1.2",
        "R1.3"
    ];
    csvHeaders = csvHeaders.concat(fairKeys);
    let csvComparison = csvHeaders.join(",") + "\n"
    let csvScores = csvHeaders.join(",") + "\n"
    resultsObjectArray.forEach((resultObject) => {
        let csvComparisonLine = [resultObject.endpointUrl, resultObject.kg];
        let csvScoresLine = [resultObject.endpointUrl, resultObject.kg];
        let indegxScore = resultObject.indegxScore.at(0)
        fairKeys.forEach((fairKey) => {
            let fairKeyIndegxScore = "Error";
            let apiScore = "NA";
            if(resultObject.apiScore.at(0) !== undefined) {
                let correspondingApiScoreObject = resultObject.apiScore.at(0).find(apiScoreObject => apiScoreObject.metric !== undefined && apiScoreObject.metric.localeCompare(fairKey) === 0);
                if (correspondingApiScoreObject !== undefined) {
                    apiScore = correspondingApiScoreObject.score;
                }
            }
            if(indegxScore !== undefined) {
                fairKeyIndegxScore = indegxScore[fairKey]
            }
            if (isNaN(Number(apiScore)) || isNaN(Number(fairKeyIndegxScore))) {
                Log.log(resultObject.kg, fairKey, "Anavailable value: IndeGx=", fairKeyIndegxScore, " FAIR Checker=", apiScore)
                csvScoresLine.push(apiScore + " (" + fairKeyIndegxScore + ")");
                csvComparisonLine.push(apiScore);
            } else {
                Log.log(resultObject.kg, fairKey, ": IndeGx=", fairKeyIndegxScore, " FAIR Checker=", apiScore)
                csvScoresLine.push((Number.parseInt(apiScore) - Number.parseInt(fairKeyIndegxScore)).toString());
                csvComparisonLine.push((fairKeyIndegxScore.localeCompare(apiScore) === 0).toString());
            }
        })
        csvComparison += csvComparisonLine.join(",") + "\n"
        csvScores += csvScoresLine.join(",") + "\n"
    })

    Global.writeFile("results_comparison.csv", csvComparison)
    Global.writeFile("results_scores.csv", csvScores)
    return ;
})
.catch((error) => {
    Log.error(error)
})


