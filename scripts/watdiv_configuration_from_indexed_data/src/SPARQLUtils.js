import { fetchGETPromise, fetchJSONPromise, fetchPOSTPromise } from "./GlobalUtils.js";
import * as RDFUtils from "./RDFUtils.js";
import * as Logger from "./LogUtils.js";
import sparqljs from "sparqljs";
export let defaultQueryTimeout = 60000;
export function setDefaultQueryTimeout(timeout) {
    if (timeout != undefined && timeout != null && timeout >= 0) {
        defaultQueryTimeout = timeout;
    }
    else {
        throw new Error("Timeout must be a positive number");
    }
}
export function sparqlQueryPromise(endpoint, query, baseURI, timeout = defaultQueryTimeout) {
    let jsonHeaders = {};
    if (isSparqlSelect(query)) {
        jsonHeaders["accept"] = "application/sparql-results+json, application/json";
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout;
        return fetchJSONPromise(queryUrl, jsonHeaders).then(result => {
            return result;
        }).catch(error => {
            Logger.error(endpoint, query, error);
            throw error;
        });
    }
    else if (isSparqlAsk(query)) {
        jsonHeaders["accept"] = "application/sparql-results+json, application/json";
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout;
        return fetchJSONPromise(queryUrl, jsonHeaders).then(result => {
            return result;
        }).catch(() => {
            return { head: {}, boolean: false };
        });
    }
    else if (isSparqlConstruct(query)) {
        jsonHeaders["accept"] = "text/turtle";
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=turtle&timeout=' + timeout;
        return fetchGETPromise(queryUrl).then(result => {
            let resultStore = RDFUtils.createStore();
            result = RDFUtils.fixCommonTurtleStringErrors(result);
            return RDFUtils.parseTurtleToStore(result, resultStore, baseURI).catch(error => {
                Logger.error(endpoint, query, error, result);
                return resultStore;
            });
        }).catch(error => { Logger.error(endpoint, query, error); throw error; });
    }
    else if (isSparqlUpdate(query)) {
        return sendUpdateQuery(endpoint, query).then(response => {
            return response;
        }).catch(error => { Logger.error(endpoint, query, error); throw error; });
    }
    else {
        Logger.error(new Error("Unexpected query type"));
    }
}
export function sendUpdateQuery(endpoint, updateQuery) {
    let updateHeader = {};
    updateHeader['Content-Type'] = 'application/sparql-update';
    return fetchPOSTPromise(endpoint, updateQuery, updateHeader).then(response => {
        return response;
    }).catch(error => {
        Logger.error("Error send update query", error);
    });
}
function checkSparqlType(queryString, queryType) {
    let parser = new sparqljs.Parser();
    try {
        let parsedQuery;
        try {
            parsedQuery = parser.parse(queryString);
        }
        catch (parsingError) {
            // This is a strange parsing error on INSERT DATA generated from pagination
            if (parsingError.message.includes("Parse error on line 1") && queryString.startsWith("INSERT DATA")) {
                return true;
            }
            Logger.error("Query parsing error", queryString, parsingError);
        }
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
export function isQuery(query) {
    return query.queryType !== undefined;
}
export function isSelect(query) {
    return isQuery(query) && query.queryType === 'SELECT';
}
export function isAsk(query) {
    return isQuery(query) && query.queryType === 'ASK';
}
export function isConstruct(query) {
    return isQuery(query) && query.queryType === 'CONSTRUCT';
}
export function isDescribe(query) {
    return isQuery(query) && query.queryType === 'DESCRIBE';
}
export function isUpdate(query) {
    return query.type !== undefined && query.type === 'update';
}
export function queryContainsService(queryString) {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if (isConstruct(parsedQuery) || isSelect(parsedQuery) || isAsk(parsedQuery) || isDescribe(parsedQuery)) {
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
