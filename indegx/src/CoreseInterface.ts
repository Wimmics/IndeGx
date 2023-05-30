import { isSparqlAsk, isSparqlConstruct, isSparqlSelect, isSparqlUpdate, sparqlQueryPromise, defaultQueryTimeout } from "./SPARQLUtils.js";
import * as $rdf from "rdflib";
import sparqljs from "sparqljs";
import * as Logger from "./LogUtils.js"

export const coreseServerUrl = "http://localhost:8080/sparql";
export const coreseDefaultGraphURI = "http://ns.inria.fr/corese/kgram/default";

export function sendUpdate(endpoint: string, queryString: string, timeout: number = defaultQueryTimeout): Promise<any> {
    if (isSparqlUpdate(queryString)) {
        return sparqlQueryPromise(coreseServerUrl, queryString, timeout).then(result => {
            return result;
        }).catch(error => {
            Logger.error("Error sending update", error)
            throw error;
        });
    } else {
        let parser = new sparqljs.Parser();
        Logger.error(new Error("Query is not an update: "), queryString, parser.parse(queryString));
        throw new Error("Query is not an update: " + queryString)
    }
}

export function sendConstruct(endpoint: string, queryString: string, timeout?: number): Promise<$rdf.Store> {
    let parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlConstruct(queryString)) {
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            return result;
        }).catch(error => {
            Logger.error("Error sending construct", error)
            throw error;
        });
    }
}

export function sendSelect(endpoint: string, queryString: string, timeout?: number): Promise<any> {
    let parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlSelect(queryString)) {
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            return result;
        }).catch(error => {
            Logger.error("Error sending select", error)
            throw error;
        });
    } else {
        throw new Error("sendSelect only accept SELECT queries")
    }
}

export function sendAsk(endpoint: string, queryString: string, timeout?: number): Promise<boolean> {
    if (isSparqlAsk(queryString)) {
        let parser = new sparqljs.Parser();
        const parsedQuery = parser.parse(queryString);
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerUrl, finalQueryString, timeout).then(result => {
            if (result != undefined && result.boolean != undefined) {
                return result.boolean;
            } else if(result != undefined && result.boolean == undefined) {
                return result;
            } else {
                throw new Error("Expected boolean property of the JSON result not found for " + queryString + " sent to " + coreseServerUrl + " instead got " + result);
            }
        }).catch(error => {
            Logger.error(endpoint, queryString, error)
            throw error;
        });
    } else {
        throw new Error("sendAsk only accept ASK queries")
    }
}