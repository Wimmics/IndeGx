import { fetchGETPromise, fetchJSONPromise, fetchPOSTPromise } from "./GlobalUtils.js";
import * as $rdf from "rdflib";
import * as RDFUtils from "./RDFUtils.js";
import sparqljs, { SparqlQuery } from "sparqljs";
import * as Logger from "./LogUtils.js"

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

export function sparqlQueryPromise(endpoint, query, timeout: number = defaultQueryTimeout): Promise<void | $rdf.Formula | SPARQLJSONResult> {
    let jsonHeaders = {};
    jsonHeaders["Accept"] = "application/sparql-results+json";
    if (isSparqlSelect(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(error => { Logger.error(endpoint, query, error); throw error })
    } else if (isSparqlAsk(query)) {
        return fetchJSONPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=json&timeout=' + timeout, jsonHeaders).catch(() => { return { boolean: false } })
    } else if (isSparqlConstruct(query)) {
        return fetchGETPromise(endpoint + '?query=' + encodeURIComponent(query) + '&format=turtle&timeout=' + timeout).then(result => {
            let resultStore = RDFUtils.createStore();
            result = RDFUtils.fixCommonTurtleStringErrors(result)
            return RDFUtils.parseTurtleToStore(result, resultStore).catch(error => {
                Logger.error(endpoint, query, error, result);
                return;
            });
        }).catch(error => { Logger.error(endpoint, query, error); throw error })
    } else if (isSparqlUpdate(query)) {
        return sendUpdateQuery(endpoint, query).catch(error => { Logger.error(endpoint, query, error); throw error });
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

function checkSparqlType(queryString: string, queryType: "CONSTRUCT" | "SELECT" | "ASK" | "DESCRIBE" | "update") {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        if ((parsedQuery as sparqljs.Query).queryType != undefined) {
            return ((parsedQuery as sparqljs.Query).queryType.localeCompare(queryType) == 0);
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

export function isQuery(query: SparqlQuery): query is sparqljs.Query {
    return (query as sparqljs.Query).queryType !== undefined;
}

export function isSelect(query: SparqlQuery): query is sparqljs.SelectQuery {
    return isQuery(query) && (query as sparqljs.SelectQuery).queryType === 'SELECT';
}

export function isAsk(query: SparqlQuery): query is sparqljs.AskQuery {
    return isQuery(query) && (query as sparqljs.AskQuery).queryType === 'ASK';
}

export function isConstruct(query: SparqlQuery): query is sparqljs.ConstructQuery {
    return isQuery(query) && (query as sparqljs.ConstructQuery).queryType === 'CONSTRUCT';
}

export function isDescribe(query: SparqlQuery): query is sparqljs.DescribeQuery {
    return isQuery(query) && (query as sparqljs.DescribeQuery).queryType === 'DESCRIBE';
}

export function isUpdate(query: SparqlQuery): query is sparqljs.Update {
    return (query as sparqljs.Update).type !== undefined && (query as sparqljs.Update).type === 'update';
}

export function sparqlQueryContainsService(queryString: string): boolean {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        return queryContainsService(parsedQuery as sparqljs.Query);
    } catch (error) {
        Logger.error(queryString, error)
    }
}

export function queryContainsService(query: sparqljs.Query): boolean {
    if (isQuery(query)) {
        return query.where.some(triple => triple.type == "service");
    } else {
        throw new Error("Not an expected query type : " + JSON.stringify(query));
    }
}

export function addServiceClauseToString(queryString: string, endpoint: string): string {
    let parser = new sparqljs.Parser();
    try {
        const parsedQuery = parser.parse(queryString);
        const editedQuery = addServiceClause(parsedQuery as sparqljs.Query, endpoint)
        let generator = new sparqljs.Generator();
        return generator.stringify(editedQuery);
    } catch (error) {
        Logger.error(queryString, error)
    }
}

export function addServiceClause(query: sparqljs.Query, endpoint: string): sparqljs.Query {
    if (isQuery(query)) {
        let serviceClause: sparqljs.ServicePattern = {
            type: 'service',
            name: $rdf.sym(endpoint),
            silent: false,
            patterns: query.where
        }
        query.where = [serviceClause];
        return query
    } else {
        throw new Error("Not an expected query type : " + JSON.stringify(query));
    }
}

