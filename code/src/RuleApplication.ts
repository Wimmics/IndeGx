import * as Corese from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js"; 
import * as RuleTree from "./RuleTree.js";
import * as SPARQLUtils from "./SPARQLUtils.js" ;
import * as Logger from "./LogUtils.js"
import dayjs from "dayjs";
import { sendConstructWithTraceHandling, sendUpdateWithTraceHandling, sendAskWithTraceHandling, sendSelectWithTraceHandling} from "./ReportUtils.js";

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
        if(entryObject.test != undefined) {
            Logger.info(endpointUrl, "Test " , entryObject.test.uri, "finished")
        }
        var actionPool = [];
        if (success) {
            if(entryObject.test != undefined) {
                Logger.info(endpointUrl,"Test " , entryObject.test.uri, "succeeded")
            }
            Logger.info(endpointUrl, "Starting success actions for " , entryObject.uri)
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
            if(entryObject.test != undefined) {
                Logger.info(endpointUrl,"Test " , entryObject.test.uri, "failed")
            }
            var actionPool = [];
            Logger.info(endpointUrl, "Starting failure actions for " , entryObject.uri)
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
    if (testObject != undefined && testObject.query != undefined) {
        var testQueries = testObject.query;
        var testsPool = [];
        testQueries.forEach(testQuery => {
            if (SPARQLUtils.isSparqlAsk(testQuery)) {
                testsPool.push(sendAskWithTraceHandling(endpointUrl, testQuery, entryObject, startTime))
            } else if (SPARQLUtils.isSparqlSelect(testQuery)) {
                testsPool.push(sendSelectWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(selectResult => {
                    return true;
                }));
            } else if(SPARQLUtils.isSparqlConstruct(testQuery)) {
                testsPool.push(sendConstructWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(constructResult => {
                    return true;
                }));
            } else if(SPARQLUtils.isSparqlUpdate(testQuery)) {
                testsPool.push(sendUpdateWithTraceHandling(endpointUrl, testQuery, entryObject, startTime).then(() => {
                    return true;
                }));
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