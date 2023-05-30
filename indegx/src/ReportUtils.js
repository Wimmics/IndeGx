import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as Rewrite from "./QueryRewrite.js";
import * as SPARQLUtils from "./SPARQLUtils.js";
import * as Logger from "./LogUtils.js";
import dayjs from "dayjs";
export let successTemplateFilename = "templates/generationAssetApplicationSuccess.sparql";
export let failureTemplateFilename = "templates/generationAssetApplicationFailure.sparql";
let failurePattern = null;
let successPattern = null;
function getFailurePattern() {
    if (failurePattern === null) {
        return GlobalUtils.readFile(failureTemplateFilename).then(content => { failurePattern = content; return content; });
    }
    else {
        return new Promise((resolve, reject) => resolve(failurePattern));
    }
}
;
function getSuccessPattern() {
    if (successPattern === null) {
        return GlobalUtils.readFile(successTemplateFilename).then(content => { successPattern = content; return content; });
    }
    else {
        return new Promise((resolve, reject) => resolve(successPattern));
    }
}
export function sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, error) {
    return getFailurePattern().then(template => {
        const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime, error);
        return Corese.sendUpdate(endpointUrl, query);
    });
}
function sendSuccessReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime) {
    return getSuccessPattern().then(template => {
        const query = replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime);
        return Corese.sendUpdate(endpointUrl, query);
    });
}
function replacePatternPlaceholders(template, endpointUrl, queryString, entryObject, startTime, endTime, error = undefined) {
    const result = Rewrite.replacePlaceholders(template, { endpointUrlString: endpointUrl, queryString: queryString, testString: entryObject.uri, startTime: startTime, endTime: endTime, reasonString: error });
    return result;
}
export function sendUpdateWithTraceHandling(endpointUrl, queryString, entryObject, startTime, timeout = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendUpdate, endpointUrl, queryString, entryObject, startTime, timeout);
}
export function sendConstructWithTraceHandling(endpointUrl, queryString, entryObject, startTime, timeout = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendConstruct, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => "");
}
export function sendSelectWithTraceHandling(endpointUrl, queryString, entryObject, startTime, timeout = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendSelect, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => { });
}
export function sendAskWithTraceHandling(endpointUrl, queryString, entryObject, startTime, timeout = SPARQLUtils.defaultQueryTimeout) {
    return sendQueryWithTraceHandling(Corese.sendAsk, endpointUrl, queryString, entryObject, startTime, timeout).finally(() => false);
}
function sendQueryWithTraceHandling(queryFunction, endpointUrl, queryString, entryObject, startTime, timeout) {
    return queryFunction(endpointUrl, queryString, timeout).then(results => {
        const endTime = dayjs();
        if (results === undefined || results.error !== undefined) {
            if (results === undefined) {
                return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, "No results returned").then(() => {
                    return results;
                });
            }
            else {
                return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, results.error).then(() => {
                    return results;
                });
            }
        }
        else {
            return sendSuccessReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime).then(() => {
                return results;
            });
        }
    }).catch(error => {
        const endTime = dayjs();
        Logger.error("Error sendQueryWithTraceHandling", error);
        return sendFailureReportUpdate(endpointUrl, queryString, entryObject, startTime, endTime, error);
    });
}
