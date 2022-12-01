import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as RuleTree from "./RuleTree.js";
import * as $rdf from "rdflib";
import * as SPARQLUtils from "./SPARQLUtils.js";
import * as Logger from "./LogUtils.js"
import * as util from "node:util"
import dayjs from "dayjs";
import { XSD } from "./RDFUtils.js";
import replaceall from "replaceall";

export var successTemplateFilename = "templates/generationAssetApplicationFailure.sparql";
export var failureTemplateFilename = "templates/generationAssetApplicationSuccess.sparql";

var failurePattern = null;
var successPattern = null;

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

function sendFailureReportUpdate(endpointUrl: string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs, error): Promise<any> {
    return getFailurePattern().then(template => {
        const query = replacePatternPlaceholders(template, queryString, entryObject, startTime, endTime, error);
        return Corese.sendUpdate(endpointUrl, query);
    });
}

function sendSuccessReportUpdate(endpointUrl: string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs): Promise<any> {
    return getSuccessPattern().then(template => {
        const query = replacePatternPlaceholders(template, queryString, entryObject, startTime, endTime);
        return Corese.sendUpdate(endpointUrl, query);
    });
}

function replacePatternPlaceholders(template : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs, error = undefined): string {
    var query = template;
    const queriesStringLiteral = $rdf.literal(queryString);
    const testStringLiteral = $rdf.sym(entryObject.uri);
    const startTimeLiteral = $rdf.literal(startTime.toISOString(), XSD("datetime"))
    const endTimeLiteral = $rdf.literal(endTime.toISOString(), XSD("datetime"))
    query = replaceall("$query", util.format("%s", queriesStringLiteral.toNT()), query);
    query = replaceall("$test", testStringLiteral.toNT(), query);
    query = replaceall("$startTime", startTimeLiteral.toNT(), query);
    query = replaceall("$endTime", endTimeLiteral.toNT(), query);
    if(error !== undefined) {
        const errorStringLiteral = $rdf.literal(JSON.stringify(error));
        query = replaceall("$reason", errorStringLiteral.toNT(), query);
    }
    return template;
}

export function sendUpdateWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendUpdate, endpointUrl, queryString, entryObject, startTime, timeout);
}

export function sendConstructWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendConstruct, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => "");
}

export function sendSelectWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendSelect, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => {});
}

export function sendAskWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendAsk, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => false);
}

function sendQueryWithTraceHandling(queryFunction : (a: string, b: string, c?: number) => Promise<any>, endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number) : Promise<any>{
    return queryFunction(endpointUrl, queryString, timeout).then(results => {
        const endTime = dayjs();
        if(results === undefined || results.error !== undefined) {
            if(results === undefined) {
                return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, "No results returned").then(() => {
                    return results;
                });
            } else {
                return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, results.error).then(() => {
                    return results;
                });
            }
        } else {
            return sendSuccessReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime).then(() => {
                return results;
            });
        }
    }).catch(error => {
        const endTime = dayjs();
        Logger.error(error);
        return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, error);
    })
}