import * as Sparql from "./SPARQLUtils.js"
import * as Log from "./LogUtils.js"
import * as Global from "./GlobalUtils.js"

const localEndpointUrl = "http://localhost:3030/FAIR-Checker/sparql"

type resultObject = {
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

Sparql.sparqlQueryPromise(localEndpointUrl, endpointQuery).then((resultsObject) => {
    let resultsObjectArray: resultObject[] = []
    resultsObject.results.bindings.forEach((binding) => {
        Log.log(binding.kg.value)
        resultsObjectArray.push({ kg: binding.kg.value, endpointUrl: binding.endpointUrl.value, apiScore: [], indegxScore: [] })
    })
    return resultsObjectArray;
}).then(resultsObjectArray => {

    // For each KG, retrieve their score through the FAIR Checker API
    let promisesArray: Promise<any>[] = [];
    resultsObjectArray.forEach((resultObject) => {
        promisesArray.push(Global.fetchJSONPromise("https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(resultObject.kg)).then((results) => {
        const APIQuery = "https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(resultObject.kg);
        promisesArray.push(Global.fetchJSONPromise(APIQuery).then((results) => {
            resultsObjectArray[resultsObjectArray.findIndex(tmpResult => tmpResult.kg === resultObject.kg && tmpResult.endpointUrl === resultObject.endpointUrl)].apiScore.push(results);
            return results;
        }))
    })

    return Promise.allSettled(promisesArray).then(() => {
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
        SELECT DISTINCT ?endpointUrl ?kg  ?measureF1A ?measureF1B ?measureF2A ?measureF2B ?measureA11 ?measureA12 ?measureI1 ?measureI1A ?measureI1B ?measureI2 ?measureI2A ?measureI2B ?measureI3 ?measureR11 ?measureR12 ?measureR13 WHERE {
          GRAPH ?kgGraph {
            ?kg dqv:hasQualityMeasurement ?measurementF1A, ?measurementF1B, ?measurementF2A, ?measurementF2B, ?measurementA11, ?measurementA12, ?measurementI1, ?measurementI1A, ?measurementI1B, ?measurementI2, ?measurementI2A, ?measurementI2B, ?measurementI3, ?measurementR11, ?measurementR12, ?measurementR13 .
            
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
                
            ?measurementI1A a dqv:QualityMeasurement ;
                dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I1#I1A> ;
                dqv:value ?measureI1A .
                
            ?measurementI1B a dqv:QualityMeasurement ;
                dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I1#I1B> ;
                dqv:value ?measureI1B .
                
            ?measurementI2 a dqv:QualityMeasurement ;
                dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I2> ;
                dqv:value ?measureI2 .
                
            ?measurementI2A a dqv:QualityMeasurement ;
                dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I2#I2A> ;
                dqv:value ?measureI2A .
                
            ?measurementI2B a dqv:QualityMeasurement ;
                dqv:isMeasurementOf <https://w3id.org/fair/principles/latest/I2#I2B> ;
                dqv:value ?measureI2B .
                
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
                let measureI1A = binding.measureI1A.value
                let measureI1B = binding.measureI1B.value
                let measureI2 = binding.measureI2.value
                let measureI2A = binding.measureI2A.value
                let measureI2B = binding.measureI2B.value
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
                    endpointUrl: endpointUrl,
                    kg: kg,
                    F1A: measureF1A,
                    F1B: measureF1B,
                    F2A: measureF2A,
                    F2B: measureF2B,
                    A11: measureA11,
                    A12: measureA12,
                    I1: measureI1,
                    I1A: measureI1A,
                    I1B: measureI1B,
                    I2: measureI2,
                    I2A: measureI2A,
                    I2B: measureI2B,
                    I3: measureI3,
                    R11: measureR11,
                    R12: measureR12,
                    R13: measureR13
                })
            })
        }).then(() => {
        return resultsObjectArray
    });

}).then(resultsObjectArray => {

    Global.writeFile("result.json", JSON.stringify(resultsObjectArray))

}).catch((error) => {
    Log.error(error)
})


// Write the results to a file

