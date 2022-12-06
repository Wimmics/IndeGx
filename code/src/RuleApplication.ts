import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js"; 
import * as RuleTree from "./RuleTree.js";
import * as SPARQLUtils from "./SPARQLUtils.js" ;
import * as Logger from "./LogUtils.js"
import dayjs from "dayjs";
import { sendConstructWithTraceHandling, sendUpdateWithTraceHandling, sendAskWithTraceHandling, sendSelectWithTraceHandling} from "./ReportUtils.js";
import { replacePlaceholders } from "./QueryRewrite.js";

export function applyRuleTree(endpointUrl: string, manifestObject: RuleTree.Manifest) {
    var applicationPool = [];
    try {
        manifestObject.includes.forEach(subManifest => {
            applicationPool.push(applyRuleTree(endpointUrl, subManifest).catch(error => Logger.error(error)));
        });
        manifestObject.entries.forEach(entry => {
            applicationPool.push(applyGenerationAsset(endpointUrl, entry).catch(error => Logger.error(error)));
        })
    } catch (error) {
        Logger.error(error)
    }
    return Promise.allSettled(applicationPool).catch(error => {
        Logger.error(error)
    });
}

function applyGenerationAsset(endpointUrl: string, entryObject: RuleTree.ManifestEntry) {
    return applyTest(endpointUrl, entryObject.test, entryObject).then(success => {
        if(entryObject.test != undefined && ! RuleTree.isDummyTest(entryObject.test)) {
            Logger.info(endpointUrl, "Test " , entryObject.test.uri, "finished")
        }
        var actionPool = [];
        if (success) {
            if(entryObject.test != undefined && ! RuleTree.isDummyTest(entryObject.test)) {
                Logger.info(endpointUrl,"Test " , entryObject.test.uri, "succeeded")
            }
            if(entryObject.actionsSuccess.length > 0) {
                Logger.info(endpointUrl, "Starting", entryObject.actionsSuccess.length, "success actions for " , entryObject.uri)
                entryObject.actionsSuccess.forEach(action => {
                    if (RuleTree.isManifestEntry(action)) {
                        const followUpEntry = action as RuleTree.ManifestEntry;
                        actionPool.push(applyGenerationAsset(endpointUrl, followUpEntry).catch(error => {
                            Logger.error(error)
                        }));
                    } else if (RuleTree.isAction(action)) {
                        const actionObject = action as RuleTree.Action;
                        actionPool.push(applyAction(endpointUrl, actionObject, entryObject).catch(error => {
                            Logger.error(error)
                        }));
                    } else {
                        throw new Error("Unexpected action type")
                    }
                })
            } else {
                Logger.info(endpointUrl, "No success actions for " , entryObject.uri)
            }
        } else {
            if(entryObject.test != undefined) {
                Logger.info(endpointUrl,"Test " , entryObject.test.uri, "failed")
            }
            var actionPool = [];
            if(entryObject.actionsFailure.length > 0) {
                Logger.info(endpointUrl, "Starting", entryObject.actionsFailure.length, "failure actions for " , entryObject.uri)
                entryObject.actionsFailure.forEach(action => {
                    if (RuleTree.isManifestEntry(action)) {
                        const followUpEntry = action as RuleTree.ManifestEntry;
                        actionPool.push(applyGenerationAsset(endpointUrl, followUpEntry).catch(error => {
                            Logger.error(error, followUpEntry)
                        }));
                    } else if (RuleTree.isAction(action)) {
                        const actionObject = action as RuleTree.Action;
                        actionPool.push(applyAction(endpointUrl, actionObject, entryObject).catch(error => {
                            Logger.error(error, actionObject)
                        }));
                    } else {
                        throw new Error("Unexpected action type " + typeof action)
                    }
                })
            } else {
                Logger.info(endpointUrl, "No failure actions for " , entryObject.uri)
            }
        }
        return Promise.allSettled(actionPool).then(() => {
            Logger.info(endpointUrl, "Finished actions for " , entryObject.uri)
        }).catch(error => {
            Logger.error(error)
        }) ;
    })
}

function applyTest(endpointUrl: string, testObject: RuleTree.Test, entryObject: RuleTree.ManifestEntry): Promise<boolean> {
    const startTime = dayjs();
    if (testObject != undefined && RuleTree.isTest(testObject) && ! RuleTree.isDummyTest(testObject)) {
        var testQueries = testObject.query;
        var testsPool = [];
        testQueries.forEach(testQuery => {
            testQuery = replacePlaceholders(testQuery, {endpointUrlString: endpointUrl})
            if (SPARQLUtils.isSparqlAsk(testQuery)) {
                testsPool.push(sendAskWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(askResult => {
                    if(askResult.error !== undefined) {
                        return false;
                    } else {
                        return askResult;
                    }
                }).finally(() => false));
            } else if (SPARQLUtils.isSparqlSelect(testQuery)) {
                testsPool.push(sendSelectWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(selectResult => {
                    if(selectResult.error !== undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }).finally(() => false));
            } else if(SPARQLUtils.isSparqlConstruct(testQuery)) {
                testsPool.push(sendConstructWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(constructResult => {
                    if(constructResult.error !== undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }).finally(() => false));
            } else if(SPARQLUtils.isSparqlUpdate(testQuery)) {
                testsPool.push(sendUpdateWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(updateResponse => {
                    if(updateResponse.error !== undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }).finally(() => false));
            }
        })
        return Promise.allSettled(testsPool).then(resultPromises => {
            return resultPromises.map(settledObject => {
                if(settledObject.status.localeCompare("fulfilled") == 0) {
                    return (settledObject as PromiseFulfilledResult<boolean>).value
                } else {
                    return false;
                }
            }).reduce((previous, current) => previous || current)
        });
    } else {
        return new Promise((resolve, reject) => resolve(true))
    }
}

function applyAction(endpointUrl: string, actionObject: RuleTree.Action, entryObject: RuleTree.ManifestEntry) : Promise<any> {
    const startTime = dayjs();
    if (actionObject.endpoint != undefined) {
        endpointUrl = actionObject.endpoint
    }
    var actionUpdatePromiseArgumentsPool = [];
    var actionConstructPromiseArgumentsPool = [];
    actionObject.action.forEach(queryString => {
        queryString = replacePlaceholders(queryString, {endpointUrlString: endpointUrl})
        if (SPARQLUtils.isSparqlUpdate(queryString)) {
            if (actionObject.timeout != undefined) {
                const actionTimeout = actionObject.timeout;

                actionUpdatePromiseArgumentsPool.push([endpointUrl, queryString, actionTimeout]);
            } else {
                actionUpdatePromiseArgumentsPool.push([endpointUrl, queryString]);
            }
        } else if(SPARQLUtils.isSparqlConstruct(queryString)) {
            actionConstructPromiseArgumentsPool.push([endpointUrl, queryString]);
        } else {
            throw new Error("Expecting Update action for " + JSON.stringify(actionObject));
        }
    });

    function updateWithTraceHandling(endpointUrl, queryString, actionTimeout) {
        return sendUpdateWithTraceHandling(endpointUrl, queryString, entryObject, startTime, actionTimeout);
    }

    function constructWithTraceHandling(endpointUrl, queryString, actionTimeout) {
        return sendConstructWithTraceHandling(endpointUrl, queryString, entryObject, startTime, actionTimeout);
    }

    var actionPool = [GlobalUtils.iterativePromises(actionUpdatePromiseArgumentsPool, updateWithTraceHandling)]
    actionPool.push(GlobalUtils.iterativePromises(actionConstructPromiseArgumentsPool, constructWithTraceHandling))
    return Promise.allSettled(actionPool);
}