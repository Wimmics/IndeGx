import { isSparqlAsk, isSparqlConstruct, isSparqlSelect, isSparqlUpdate, sparqlQueryPromise, defaultQueryTimeout, JSONValue, SPARQLJSONResult, ASKJSONResult, SELECTJSONResult } from "./SPARQLUtils.js";
import * as $rdf from "rdflib";
import sparqljs from "sparqljs";
import * as Logger from "./LogUtils.js"

export const coreseServerQueryUrl = "http://corese:3030/ds/sparql";
export const coreseServerUpdateUrl = "http://corese:3030/ds/update";
export const coreseDefaultGraphURI = "urn:x-arq:DefaultGraph";

export function sendUpdate(endpoint: string, queryString: string, baseURI: string, timeout: number = defaultQueryTimeout): Promise<void> {
    if (isSparqlUpdate(queryString)) {
        return sparqlQueryPromise(coreseServerUpdateUrl, queryString, baseURI, {timeout: timeout}).then(() => {
            return ;
        }).catch(error => {
            Logger.error("Error sending update for " + endpoint, error)
            throw error;
        });
    } else {
        let parser = new sparqljs.Parser();
        Logger.error(new Error("Query is not an update: "), queryString, parser.parse(queryString));
        throw new Error("Query is not an update: " + queryString)
    }
}

export function sendConstruct(endpoint: string, queryString: string, baseURI: string, timeout?: number): Promise<$rdf.Store> {
    let parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlConstruct(queryString)) {
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerQueryUrl, finalQueryString, baseURI, {timeout: timeout}).then(result => {
            return result as $rdf.Store;
        }).catch(error => {
            Logger.error("Error sending construct to " + endpoint, error)
            throw error;
        }) as Promise<$rdf.Store>;
    }
}

export function sendSelect(endpoint: string, queryString: string, baseURI: string, timeout?: number): Promise<SELECTJSONResult> {
    let parser = new sparqljs.Parser();
    const parsedQuery = parser.parse(queryString);
    if (isSparqlSelect(queryString)) {
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerQueryUrl, finalQueryString, baseURI, {timeout: timeout}).then(result => {
            return result as SELECTJSONResult;
        }).catch(error => {
            Logger.error("Error sending select to " + endpoint, error)
            throw error;
        });
    } else {
        throw new Error("sendSelect only accept SELECT queries")
    }
}

export function sendAsk(endpoint: string, queryString: string, baseURI: string, timeout?: number): Promise<boolean> {
    if (isSparqlAsk(queryString)) {
        let parser = new sparqljs.Parser();
        const parsedQuery = parser.parse(queryString);
        const queryGenerator = new sparqljs.Generator();
        const finalQueryString = queryGenerator.stringify(parsedQuery);
        return sparqlQueryPromise(coreseServerQueryUrl, finalQueryString, baseURI, {timeout: timeout}).then(result => {
            if (result != undefined && (result as ASKJSONResult).boolean != undefined) {
                return (result as ASKJSONResult).boolean;
            } else {
                throw new Error("Expected boolean property of the JSON result not found for " + queryString + " sent to " + coreseServerQueryUrl + " instead got " + JSON.stringify(result));
            }
        }).catch(error => {
            Logger.error(endpoint, queryString, error)
            throw error;
        });
    } else {
        throw new Error("sendAsk only accept ASK queries")
    }
}