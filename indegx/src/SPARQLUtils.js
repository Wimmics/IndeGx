import { fetchGETPromise, fetchJSONPromise, fetchPOSTPromise } from "./GlobalUtils.js";
import * as RDFUtils from "./RDFUtils.js";
import sparqljs from "sparqljs";
import * as Logger from "./LogUtils.js";
export let defaultQueryTimeout = 60000;
export function setDefaultQueryTimeout(timeout) {
    if (timeout != undefined && timeout != null && timeout >= 0) {
        defaultQueryTimeout = timeout;
    }
    else {
        throw new Error("Timeout must be a positive number");
    }
}
export function sparqlQueryPromise(endpoint, query, timeout = defaultQueryTimeout) {
    let jsonHeaders = new Map();
    jsonHeaders.set("Accept", "application/sparql-results+json");
    if (isSparqlSelect(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(error => { Logger.error(endpoint, query, error); throw error; });
    }
    else if (isSparqlAsk(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(() => { return { boolean: false }; });
    }
    else if (isSparqlConstruct(query)) {
        return fetchGETPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=turtle&timeout=' + timeout).then(result => {
            let resultStore = RDFUtils.createStore();
            result = result.replaceAll("nodeID://", "_:"); // Dirty hack to fix nodeID:// from Virtuoso servers for turtle
            return RDFUtils.parseTurtleToStore(result, resultStore).catch(error => {
                Logger.error(endpoint, query, error, result);
                return;
            });
        }).catch(error => { Logger.error(endpoint, query, error); throw error; });
    }
    else if (isSparqlUpdate(query)) {
        return sendUpdateQuery(endpoint, query).catch(error => { Logger.error(endpoint, query, error); throw error; });
    }
    else {
        Logger.error(new Error("Unexpected query type"));
    }
}
export function sendUpdateQuery(endpoint, updateQuery) {
    let updateHeader = new Map();
    updateHeader.set('Content-Type', 'application/sparql-update');
    return fetchPOSTPromise(endpoint, updateQuery, updateHeader).then(response => {
        return response;
    }).catch(error => {
        Logger.error("Error send update query", error);
    });
}
function checkSparqlType(queryString, queryType) {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if (parsedQuery.queryType != undefined) {
            return (parsedQuery.queryType.localeCompare(queryType) == 0);
        }
        else if (parsedQuery.type != undefined) {
            return (parsedQuery.type.localeCompare(queryType) == 0);
        }
        else {
            throw new Error("No expected query type property : " + JSON.stringify(parsedQuery));
        }
    }
    catch (error) {
        Logger.error(queryString, error);
    }
}
export function isSparqlConstruct(queryString) {
    return checkSparqlType(queryString, "CONSTRUCT");
}
export function isSparqlSelect(queryString) {
    return checkSparqlType(queryString, "SELECT");
}
export function isSparqlAsk(queryString) {
    return checkSparqlType(queryString, "ASK");
}
export function isSparqlDescribe(queryString) {
    return checkSparqlType(queryString, "DESCRIBE");
}
export function isSparqlUpdate(queryString) {
    return checkSparqlType(queryString, "update");
}
export function queryContainsService(queryString) {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if (isSparqlConstruct(queryString) || isSparqlSelect(queryString) || isSparqlAsk(queryString) || isSparqlDescribe(queryString)) {
            return parsedQuery.where.some(triple => triple.type == "service");
        }
        else {
            throw new Error("Not an expected query type : " + JSON.stringify(queryString));
        }
    }
    catch (error) {
        Logger.error(queryString, error);
    }
}
export function addServiceClause(queryString, endpoint) {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if (isSparqlConstruct(queryString) || isSparqlSelect(queryString) || isSparqlAsk(queryString) || isSparqlDescribe(queryString)) {
            let serviceClause = {
                type: "service",
                name: { termType: "NamedNode", value: endpoint },
                silent: false,
                patterns: parsedQuery.where
            };
            parsedQuery.where = [serviceClause];
            let generator = new sparqljs.Generator();
            return generator.stringify(parsedQuery);
        }
        else {
            throw new Error("Not an expected query type : " + JSON.stringify(queryString));
        }
    }
    catch (error) {
        Logger.error(queryString, error);
    }
}
