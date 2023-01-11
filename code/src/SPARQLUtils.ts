import { fetchJSONPromise, fetchPOSTPromise } from "./GlobalUtils.js";
import * as sparqljs from "sparqljs";
import * as Logger from "./LogUtils.js"

export var defaultQueryTimeout = 60000;

export function sparqlQueryPromise(endpoint, query, timeout: number = defaultQueryTimeout) {
    var jsonHeaders = new Map();
    jsonHeaders.set("Accept", "application/sparql-results+json")
    if ( isSparqlSelect(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(error => { Logger.error(endpoint, query, error); throw error })
    } else if (isSparqlAsk(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(() => { boolean:false})
    } else if ( isSparqlConstruct(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout).catch(error => { Logger.error(endpoint, query, error); throw error })
    }else if(isSparqlUpdate(query)) {
        return sendUpdateQuery(endpoint, query).catch(error => { Logger.error(endpoint, query, error); throw error });
    } else {
        Logger.error(new Error("Unexpected query type"))
    }
}

export function sendUpdateQuery(endpoint, updateQuery) {
    var updateHeader = new Map();
    updateHeader.set('Content-Type', 'application/sparql-update');
    return fetchPOSTPromise(endpoint, updateQuery, updateHeader).then(response => {
        return response;
    }).catch(error => {
        Logger.error(error)
    })
}

function checkSparqlType(queryString : string, queryType : "CONSTRUCT" | "SELECT" | "ASK" | "DESCRIBE" | "update") {
    var parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if(parsedQuery.queryType != undefined) {
            return (parsedQuery.queryType.localeCompare(queryType) == 0);
        } else if(parsedQuery.type != undefined) {
            return (parsedQuery.type.localeCompare(queryType) == 0);
        } else {
            throw new Error("No expected query type property : " + JSON.stringify(parsedQuery));
        }
    } catch(error) {
        Logger.error(queryString, error)
    }
}

export function isSparqlConstruct(queryString: string): boolean {
    return checkSparqlType(queryString, "CONSTRUCT");
}

export function isSparqlSelect(queryString: string): boolean {
    return checkSparqlType(queryString, "SELECT");
}

export function isSparqlAsk(queryString: string): boolean {
    return checkSparqlType(queryString, "ASK");
}

export function isSparqlDescribe(queryString: string): boolean {
    return checkSparqlType(queryString, "DESCRIBE");
}

export function isSparqlUpdate(queryString: string): boolean {
    return checkSparqlType(queryString, "update");
}

