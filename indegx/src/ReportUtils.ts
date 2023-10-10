import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as Rewrite from "./QueryRewrite.js";
import * as RuleTree from "./RuleTree.js";
import * as SPARQLUtils from "./SPARQLUtils.js";
import * as Logger from "./LogUtils.js"
import * as $rdf from "rdflib";
import dayjs from "dayjs";

export let successTemplateFilename = "templates/generationAssetApplicationSuccess.sparql";
export let successTestTemplateFilename = "templates/generationAssetApplicationSuccessTest.sparql";
export let failureTemplateFilename = "templates/generationAssetApplicationFailure.sparql";

let logMode = true;

let failurePattern = null;
let successPattern = null;
let successTestPattern = null;

export function setLogMode(mode: boolean) {
    logMode = mode;
}

export function getLogMode(): boolean {
    return logMode;
}

function getFailurePattern(): Promise<string> {
    if (failurePattern === null) {
        return GlobalUtils.readFile(failureTemplateFilename).then(content => { failurePattern = content; return content })
    } else {
        return new Promise<string>((resolve, reject) => resolve(failurePattern))
    }
};

function getSuccessPattern(): Promise<string> {
    if (successPattern === null) {
        return GlobalUtils.readFile(successTemplateFilename).then(content => { successPattern = content; return content })
    } else {
        return new Promise<string>((resolve, reject) => resolve(successPattern))
    }
}

function getSuccessTestPattern(endpointUrl: string, queryString: string, baseURI: string): Promise<string> {
    if (successPattern === null) {
        return GlobalUtils.readFile(successTestTemplateFilename).then(content => { successTestPattern = replacePatternPlaceholders(content, endpointUrl, queryString); return successTestPattern })
    } else {
        return new Promise<string>((resolve, reject) => resolve(successTestPattern))
    }
}

export function sendFailureReportUpdate(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs, error): Promise<any> {
    if (getLogMode()) {
        return getFailurePattern().then(template => {
            const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime, error);
            return Corese.sendUpdate(endpointUrl, query, baseURI);
        });
    } else {
        return Promise.resolve();
    }
}

function sendSuccessReportUpdate(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs): Promise<any> {
    if (getLogMode()) {
        return getSuccessPattern().then(template => {
            const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime);
            return Corese.sendUpdate(endpointUrl, query, baseURI);
        });
    } else {
        return Promise.resolve();
    }
}

function replacePatternPlaceholders(template: string, endpointUrl: string, queryString: string, entryObject?: RuleTree.ManifestEntry, startTime?: dayjs.Dayjs, endTime?: dayjs.Dayjs, error?): string {
    const result = Rewrite.replacePlaceholders(template, { endpointUrlString: endpointUrl, queryString: queryString, testString: entryObject.uri, startTime: startTime, endTime: endTime, reasonString: error });
    return result;
}

export function sendUpdateWithTraceHandling(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendUpdate, endpointUrl, queryString, baseURI, entryObject, startTime, timeout);
}

export function sendConstructWithTraceHandling(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout): Promise<$rdf.Store> {
    return sendQueryWithTraceHandling(Corese.sendConstruct, endpointUrl, queryString, baseURI, entryObject, startTime, timeout).finally(() => "");
}

export function sendSelectWithTraceHandling(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendSelect, endpointUrl, queryString, baseURI, entryObject, startTime, timeout).finally(() => { });
}

export function sendAskWithTraceHandling(endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendAsk, endpointUrl, queryString, baseURI, entryObject, startTime, timeout).finally(() => false);
}

/**
 * Sends a query to the specified endpoint URL with the given query string and base URI, and handles success and failure reports.
 * @param queryFunction - The function to use for sending the query.
 * @param endpointUrl - The URL of the endpoint to send the query to.
 * @param queryString - The query string to send.
 * @param baseURI - The base URI to use for the query.
 * @param entryObject - The manifest entry object for the query.
 * @param startTime - The start time of the query.
 * @param timeout - The timeout for the query.
 * @returns A promise that resolves with the query results, or rejects with an error.
 */
function sendQueryWithTraceHandling(queryFunction: (a: string, b: string, c: string, d?: number) => Promise<any>, endpointUrl: string, queryString: string, baseURI: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number): Promise<any> {
    return queryFunction(endpointUrl, queryString, baseURI, timeout).then(results => {
        const endTime = dayjs();
        if (results === undefined || results.error !== undefined) {
            if (results === undefined) {
                return sendFailureReportUpdate(endpointUrl, queryString, baseURI, entryObject, startTime, endTime, "No results returned").then(() => {
                    return results;
                });
            } else {
                return sendFailureReportUpdate(endpointUrl, queryString, baseURI, entryObject, startTime, endTime, results.error).then(() => {
                    return results;
                });
            }
        } else {
            return sendSuccessReportUpdate(endpointUrl, queryString, baseURI, entryObject, startTime, endTime).then(() => {
                return results;
            });
        }
    }).catch(error => {
        Logger.error("Error sendQueryWithTraceHandling", error)
        const endTime = dayjs();
        return sendFailureReportUpdate(endpointUrl, queryString, baseURI, entryObject, startTime, endTime, error);
    })
}

/**
 * Checks if a previous execution of a query has passed for a given endpoint URL and query string.
 * @param endpointUrl - The URL of the SPARQL endpoint to check.
 * @param query - The query string to check.
 * @param baseURI - The base URI for the query.
 * @returns A Promise that resolves to a boolean indicating whether a previous execution has passed.
 */
export function checkPreviousExecution(endpointUrl: string, query: string, baseURI: string): Promise<boolean> {
    return getSuccessTestPattern(endpointUrl, query, baseURI).then(pattern => Corese.sendAsk(endpointUrl, pattern, baseURI)).finally(() => {
        return Promise.resolve(false);
    })
}
