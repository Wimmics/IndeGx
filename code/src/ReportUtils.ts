import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as Rewrite from "./QueryRewrite.js";
import * as RuleTree from "./RuleTree.js";
import * as SPARQLUtils from "./SPARQLUtils.js";
import * as Logger from "./LogUtils.js"
import * as $rdf from "rdflib";
import dayjs from "dayjs";

export let successTemplateFilename = "templates/generationAssetApplicationSuccess.sparql";
export let failureTemplateFilename = "templates/generationAssetApplicationFailure.sparql";

let failurePattern = null;
let successPattern = null;

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

export function sendFailureReportUpdate(endpointUrl: string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs, error): Promise<any> {
    return getFailurePattern().then(template => {
        const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime, error);
        return Corese.sendUpdate(endpointUrl, query);
    });
}

function sendSuccessReportUpdate(endpointUrl: string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs): Promise<any> {
    return getSuccessPattern().then(template => {
        const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime);
        return Corese.sendUpdate(endpointUrl, query);
    });
}

function replacePatternPlaceholders(template : string, endpointUrl: string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, endTime: dayjs.Dayjs, error = undefined): string {
    const result = Rewrite.replacePlaceholders(template, { endpointUrlString: endpointUrl, queryString:queryString, testString: entryObject.uri, startTime:startTime, endTime:endTime, reasonString:error });
    return result;
}

export function sendUpdateWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendUpdate, endpointUrl, queryString, entryObject, startTime, timeout);
}

export function sendConstructWithTraceHandling(endpointUrl : string, queryString: string, entryObject: RuleTree.ManifestEntry, startTime: dayjs.Dayjs, timeout: number = SPARQLUtils.defaultQueryTimeout): Promise<$rdf.Store> {
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