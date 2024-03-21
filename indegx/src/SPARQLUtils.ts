import { fetchGETPromise, fetchJSONPromise, fetchPOSTPromise } from "./GlobalUtils.js";
import * as RDFUtils from "./RDFUtils.js";
import * as Logger from "./LogUtils.js"
import * as sparqljs from "sparqljs";
import * as $rdf from "rdflib";

export type JSONValue =
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

interface JSONObject {
    [x: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> { }

export interface SPARQLJSONResult extends JSONObject {
    head: {
        vars?: string[]
    },
    results?: {
        bindings: {
            [x: string]: {
                type: string,
                value: string
            }
        }[]
    }
    boolean?: boolean
}

export interface SELECTJSONResult extends SPARQLJSONResult {
    head: {
        vars: string[]
    },
    results: {
        bindings: {
            [x: string]: {
                type: string,
                value: string
            }
        }[]
    }
}

export interface ASKJSONResult extends SPARQLJSONResult {
    boolean: boolean
}


export let defaultQueryTimeout = 60000;

export function setDefaultQueryTimeout(timeout: number) {
    if (timeout != undefined && timeout != null && timeout >= 0) {
        defaultQueryTimeout = timeout;
    } else {
        throw new Error("Timeout must be a positive number")
    }
}

export type sparqlQueryPromiseConfig = {
    timeout?: number,
    accept?: string
}

export function sparqlQueryPromise(endpoint: string, query: string, baseURI: string, config: sparqlQueryPromiseConfig = {}): Promise<void | $rdf.Store | SPARQLJSONResult | string> {
    let httpHeaders = {};

    if (config.accept != undefined) {
        httpHeaders["accept"] = config.accept;
    } else {
        if (isSparqlSelect(query) || isSparqlAsk(query)) {
            httpHeaders["accept"] = "application/sparql-results+json, application/json";
        } else if (isSparqlConstruct(query)) {
            httpHeaders["accept"] = "text/turtle";
        }
    }
    if (config.timeout == undefined) {
        config.timeout = defaultQueryTimeout;
    }

    if (isSparqlSelect(query)) {
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + config.timeout;
        return fetchJSONPromise(queryUrl, httpHeaders).then(result => {
            return (result as SELECTJSONResult)
        }).catch(error => {
            Logger.error(endpoint, query, error);
            throw error
        })
    } else if (isSparqlAsk(query)) {
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + config.timeout;
        return fetchJSONPromise(queryUrl, httpHeaders).then(result => {
            return (result as ASKJSONResult)
        }).catch(() => {
            return { head: {}, boolean: false } as ASKJSONResult
        })
    } else if (isSparqlConstruct(query)) {
        const queryUrl = endpoint + '?query=' + encodeURIComponent(query) + '&format=turtle&timeout=' + config.timeout;
        return fetchGETPromise(queryUrl).then(result => {
            let resultStore = RDFUtils.createStore();
            result = RDFUtils.fixCommonTurtleStringErrors(result)
            return RDFUtils.parseTurtleToStore(result, resultStore, baseURI).catch(error => {
                Logger.error(endpoint, query, error, result);
                return resultStore;
            });
        }).catch(error => { Logger.error(endpoint, query, error); throw error })
    } else if (isSparqlUpdate(query)) {
        return sendUpdateQuery(endpoint, query).then(response => {
            return response;
        }).catch(error => { Logger.error(endpoint, query, error); throw error });
    } else {
        Logger.error(new Error("Unexpected query type"))
    }
}

export function sendUpdateQuery(endpoint, updateQuery) {
    let updateHeader = {};
    updateHeader['Content-Type'] = 'application/sparql-update';
    return fetchPOSTPromise(endpoint, updateQuery, updateHeader).then(response => {
        return response;
    }).catch(error => {
        Logger.error("Error send update query", error);
    })
}

function checkSparqlType(queryString: string, queryType: "CONSTRUCT" | "SELECT" | "ASK" | "DESCRIBE" | "update"): boolean {
    let parser = new sparqljs.Parser({ sparqlStar: false });
    try {
        let parsedQuery;
        try {
            parsedQuery = parser.parse(queryString);
        } catch (parsingError) {
            // This is a strange parsing error on INSERT DATA generated from pagination
            if ((parsingError as Error).message.includes("Parse error on line 1") && queryString.startsWith("INSERT DATA")) {
                return true;
            }
            Logger.error("Query parsing error", queryString, parsingError)
        }
        if (parsedQuery.queryType != undefined) {
            return (parsedQuery.queryType.localeCompare(queryType) == 0);
        } else if (parsedQuery.type != undefined) {
            return (parsedQuery.type.localeCompare(queryType) == 0);
        } else {
            throw new Error("No expected query type property : " + JSON.stringify(parsedQuery));
        }
    } catch (error) {
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

export function isQuery(query: sparqljs.SparqlQuery): query is sparqljs.Query {
    return (query as sparqljs.Query).queryType !== undefined;
}

export function isSelect(query: sparqljs.SparqlQuery): query is sparqljs.SelectQuery {
    return isQuery(query) && (query as sparqljs.SelectQuery).queryType === 'SELECT';
}

export function isAsk(query: sparqljs.SparqlQuery): query is sparqljs.AskQuery {
    return isQuery(query) && (query as sparqljs.AskQuery).queryType === 'ASK';
}

export function isConstruct(query: sparqljs.SparqlQuery): query is sparqljs.ConstructQuery {
    return isQuery(query) && (query as sparqljs.ConstructQuery).queryType === 'CONSTRUCT';
}

export function isDescribe(query: sparqljs.SparqlQuery): query is sparqljs.DescribeQuery {
    return isQuery(query) && (query as sparqljs.DescribeQuery).queryType === 'DESCRIBE';
}

export function isUpdate(query: sparqljs.SparqlQuery): query is sparqljs.Update {
    return (query as sparqljs.Update).type !== undefined && (query as sparqljs.Update).type === 'update';
}

export function queryContainsService(queryString: string): boolean {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if (isConstruct(parsedQuery) || isSelect(parsedQuery) || isAsk(parsedQuery) || isDescribe(parsedQuery)) {
            return parsedQuery.where.some(triple => triple.type == "service");
        } else {
            throw new Error("Not an expected query type : " + JSON.stringify(queryString));
        }
    } catch (error) {
        Logger.error(queryString, error)
    }
}

export function addServiceClause(queryString: string, endpoint: string): string {
    let parser = new sparqljs.Parser();
    try {
        if (isSparqlConstruct(queryString) || isSparqlSelect(queryString) || isSparqlAsk(queryString) || isSparqlDescribe(queryString)) {
            const parsedQuery = parser.parse(queryString);
            let serviceClause = {
                type: "service",
                name: { termType: "NamedNode", value: endpoint },
                silent: false,
                patterns: parsedQuery.where
            }
            parsedQuery.where = [serviceClause];
            let generator = new sparqljs.Generator();
            return generator.stringify(parsedQuery);
        } else {
            throw new Error("Not an expected query type : " + JSON.stringify(queryString));
        }
    } catch (error) {
        Logger.error(queryString, error)
    }
}

