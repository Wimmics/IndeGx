import { isSparqlAsk, isSparqlConstruct, isSparqlSelect, isSparqlUpdate, sparqlQueryPromise } from "./SPARQLUtils.js";
import * as $rdf from "rdflib";
import sparqljs from "sparqljs";
import * as Logger from "./LogUtils.js"

export const coreseServerUrl = "http://localhost:8080/sparql";
export const coreseDefaultGraphURI = "http://ns.inria.fr/corese/kgram/default";

function rewriteKeywords(endpointUrl: string, queryString: string): string {
    return queryString.replace(/\$rawEndpointUrl/g, $rdf.sym(endpointUrl).toNT());
}

export function sendUpdate(endpoint: string, queryString: string, timeout?: number) {
    queryString = rewriteKeywords(endpoint, queryString);
    if (isSparqlUpdate(queryString)) {
        return sparqlQueryPromise(coreseServerUrl, queryString, timeout).then(result => {
            return result;
        }).catch(error => {
            Logger.error(error)
        });
    }
}

export function sendConstruct(endpoint: string, queryString: string, timeout?: number) {
    queryString = rewriteKeywords(endpoint, queryString);
    var parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlConstruct(queryString)) {
        const whereContent = parsedQuery.where;
        parsedQuery.where = [{
            "type": "service",
            "patterns": whereContent,
            "name": {
                "termType": "NamedNode",
                "value": endpoint
            },
            "silent": false
        }]
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            return result;
        }).catch(error => {
            Logger.error(error)
        });
    }
}

export function sendSelect(endpoint: string, queryString: string, timeout?: number) {
    queryString = rewriteKeywords(endpoint, queryString);
    var parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlSelect(queryString)) {
        const surroundingQueryString = "SELECT * { SERVICE <" + endpoint + "> {  } }";
        var surroundingQueryObject = parser.parse(surroundingQueryString);
        surroundingQueryObject.where.forEach(whereObject => {
            if (whereObject.type.localeCompare("service") == 0) {
                whereObject.patterns = (parsedQuery.where);
            }
        })
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(surroundingQueryObject);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            try {
                return result;
            } catch (error) {
                throw error;
            }
        }).catch(error => {
            Logger.error(error)
        });
    } else {
        throw new Error("sendAsk only accept ASK queries")
    }
}

export function sendAsk(endpoint: string, queryString: string, timeout?: number): Promise<boolean> {
    queryString = rewriteKeywords(endpoint, queryString);
    if (isSparqlAsk(queryString)) {
        var parser = new sparqljs.Parser();
        const parsedQuery = parser.parse(queryString);
        const surroundingQueryString = "ASK { SERVICE <" + endpoint + "> {  } }";
        var surroundingQueryObject = parser.parse(surroundingQueryString);
        surroundingQueryObject.where.forEach(whereObject => {
            if (whereObject.type.localeCompare("service") == 0) {
                whereObject.patterns = (parsedQuery.where);
            }
        })
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(surroundingQueryObject);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            if (result != undefined && result.boolean != undefined) {
                return result.boolean;
            } else {
                throw new Error("Expected boolean property of the JSON result not found for " + queryString  + " sent to " + endpoint);
            }
        }).catch(error => {
            Logger.error(endpoint, queryString, error)
            return new Promise((resolve, reject) => resolve(false))
        });
    } else {
        throw new Error("sendAsk only accept ASK queries")
    }
}