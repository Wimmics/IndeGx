import * as Global from "./GlobalUtils.js";
import * as RuleTree from "./RuleTree.js";
import * as SPARQLUtils from "./SPARQLUtils.js";
import * as Logger from "./LogUtils.js"
import * as RDFUtils from "./RDFUtils.js"
import * as IndexUtils from "./IndexUtils.js"
import dayjs from "dayjs";
import { sendConstructWithTraceHandling, sendUpdateWithTraceHandling, sendAskWithTraceHandling, sendSelectWithTraceHandling, sendFailureReportUpdate } from "./ReportUtils.js";
import { replacePlaceholders } from "./QueryRewrite.js";
import { EndpointObject } from "./CatalogInput.js";
import sparqljs from "sparqljs";
import { AssetTracker } from "./AssetTracker.js";
import { coreseServerUrl, sendAsk } from "./CoreseInterface.js";

let resilienceMode = false;

/**
 * Set the resilience mode. If true, the application of a rule tree will try to pick up where it left off if it was interrupted by looking for the trace of successfull applications.
 * @param mode 
 */
export function setResilienceMode(mode: boolean) {
    resilienceMode = mode;
}

/**
 * Applies a rule tree to an endpoint object and a manifest object.
 * 
 * @param endpointObject - The endpoint object to apply the rule tree to.
 * @param manifestObject - The manifest object containing the rule tree to apply.
 * @param postMode - Whether to apply the rule tree in post mode.
 * @returns A promise that resolves when the rule tree has been applied.
 */
export function applyRuleTree(endpointObject: EndpointObject, manifestObject: RuleTree.Manifest, postMode: boolean = false): Promise<void> {
    if (AssetTracker.getInstance().hasApplicationPromise(manifestObject.uri, endpointObject.endpoint)) {
        return AssetTracker.getInstance().getApplicationPromise(manifestObject.uri, endpointObject.endpoint);
    } else {
        AssetTracker.getInstance().setAssetStateToOngoing(manifestObject.uri, endpointObject.endpoint);
        let requiredAssetsPool = [];
        manifestObject.requiredAssets.forEach(requiredAssetURI => {
            if (AssetTracker.getInstance().hasApplicationPromise(requiredAssetURI, endpointObject.endpoint)) {
                requiredAssetsPool.push(AssetTracker.getInstance().getApplicationPromise(requiredAssetURI, endpointObject.endpoint))
            } else {
                if (!AssetTracker.getInstance().hasAsset(requiredAssetURI)) {
                    Logger.error("AssetTracker has no asset", requiredAssetURI);
                    throw new Error("AssetTracker has no asset " + requiredAssetURI);
                } else {
                    let requiredAsset = AssetTracker.getInstance().getAsset(requiredAssetURI);
                    // Logger.log("Applying required asset", requiredAsset.uri, "of", manifestObject.uri, "for endpoint", endpointObject.endpoint)
                    if (RuleTree.isManifestEntry(requiredAsset)) {
                        requiredAssetsPool.push(applyManifestEntry(endpointObject, requiredAsset as RuleTree.ManifestEntry, postMode))
                    } else if (RuleTree.isAction(requiredAsset)) {
                        requiredAssetsPool.push(applyAction(endpointObject, requiredAsset as RuleTree.Action, undefined, postMode))
                    } else if (RuleTree.isManifest(requiredAsset)) {
                        requiredAssetsPool.push(applyRuleTree(endpointObject, requiredAsset as RuleTree.Manifest, postMode))
                    }
                }
            }
        })

        let entriesApplicationPool = [];
        try {
            manifestObject.entries.forEach(entry => {
                entriesApplicationPool.push([endpointObject, entry, postMode])
            })
        } catch (error) {
            Logger.error("Error applying rule tree", error)
        }

        let result = Promise.allSettled(requiredAssetsPool)
            .then(() => Global.iterativePromises(entriesApplicationPool, applyManifestEntry))
            .then(() => {
                let subTreeApplicationPool = [];
                manifestObject.includes.forEach(subManifest => {
                    subTreeApplicationPool.push(applyRuleTree(endpointObject, subManifest as RuleTree.Manifest, postMode)
                        .catch(error =>
                            Logger.error("Error applying rule tree", error)
                        ));
                });
                return Promise.allSettled(subTreeApplicationPool)
                    .then(() => {
                        AssetTracker.getInstance().setAssetStateToFinished(manifestObject.uri, endpointObject.endpoint);
                        return;
                    })
            })
            .catch(error => {
                Logger.error("Error applying rule tree", error)
            });
        AssetTracker.getInstance().setApplicationPromise(manifestObject.uri, endpointObject.endpoint, result);

        return result;
    }
}

/**
 * Applies a manifest entry to an endpoint object.
 * @param endpointObject The endpoint object to apply the manifest entry to.
 * @param entryObject The manifest entry to apply.
 * @param postMode A boolean indicating whether the application is in post mode.
 * @returns A promise that resolves when the manifest entry has been applied.
 */
function applyManifestEntry(endpointObject: EndpointObject, entryObject: RuleTree.ManifestEntry, postMode: boolean): Promise<void> {
    let requiredAssets = entryObject.requiredAssets;
    let requiredPromises = [];
    if (requiredAssets !== undefined && requiredAssets.length > 0) {
        requiredAssets.forEach(requiredAssetURI => {
            if (AssetTracker.getInstance().hasApplicationPromise(requiredAssetURI, endpointObject.endpoint)) {
                requiredPromises.push(AssetTracker.getInstance().getApplicationPromise(requiredAssetURI, endpointObject.endpoint))
            } else {
                let requiredAsset = AssetTracker.getInstance().getAsset(requiredAssetURI);
                if (RuleTree.isManifestEntry(requiredAsset)) {
                    requiredPromises.push(applyManifestEntry(endpointObject, requiredAsset as RuleTree.ManifestEntry, postMode))
                } else if (RuleTree.isAction(requiredAsset)) {
                    requiredPromises.push(applyAction(endpointObject, requiredAsset as RuleTree.Action, entryObject, postMode))
                } else if (RuleTree.isManifest(requiredAsset)) {
                    requiredPromises.push(applyRuleTree(endpointObject, requiredAsset as RuleTree.Manifest, postMode))
                }
            }
        })
    }

    let result = Promise.allSettled(requiredPromises).then(() => {
        if (!AssetTracker.getInstance().isOngoing(endpointObject.endpoint, entryObject.uri)) {
            AssetTracker.getInstance().setAssetStateToOngoing(entryObject.uri, endpointObject.endpoint);
            return applyTest(endpointObject, entryObject.test, entryObject, postMode).then(success => {
                if (entryObject.test != undefined && !RuleTree.isDummyTest(entryObject.test)) {
                    Logger.info("Test ", entryObject.test.uri, "finished on endpoint", endpointObject.endpoint)
                }
                let actionPool = [];
                if (success) {
                    if (entryObject.test != undefined && !RuleTree.isDummyTest(entryObject.test)) {
                        Logger.info("Test ", entryObject.test.uri, "succeeded on endpoint", endpointObject.endpoint)
                    }
                    if (entryObject.actionsSuccess.length > 0) {
                        Logger.info("Starting", entryObject.actionsSuccess.map(asset => asset.uri), "success actions for ", entryObject.uri, "on endpoint", endpointObject.endpoint)
                        entryObject.actionsSuccess.forEach(action => {
                            if (RuleTree.isManifestEntry(action)) {
                                const followUpEntry = action as RuleTree.ManifestEntry;
                                actionPool.push(applyManifestEntry(endpointObject, followUpEntry, postMode).catch(error => {
                                    Logger.error("Error applying generation asset", error);
                                }));
                            } else if (RuleTree.isAction(action)) {
                                const actionObject = action as RuleTree.Action;
                                actionPool.push(applyAction(endpointObject, actionObject, entryObject, postMode).catch(error => {
                                    Logger.error("Error applying generation asset", error);
                                }));
                            } else if (RuleTree.isManifest(action)) {
                                const subManifest = action as RuleTree.Manifest;
                                actionPool.push(applyRuleTree(endpointObject, subManifest).catch(error => {
                                    Logger.error("Error applying generation asset", error);
                                }));
                            } else {
                                Logger.error("Unexpected action type", action);
                                throw new Error("Unexpected action type")
                            }
                        })
                    } else {
                        Logger.info(endpointObject.endpoint, "No success actions for ", entryObject.uri)
                    }
                } else {
                    if (entryObject.test != undefined) {
                        Logger.info(endpointObject.endpoint, "Test ", entryObject.test.uri, "failed")
                    }
                    let actionPool = [];
                    if (entryObject.actionsFailure.length > 0) {
                        Logger.info("Starting", entryObject.actionsFailure.length, "failure actions for ", entryObject.uri, "on endpoint", endpointObject.endpoint)
                        entryObject.actionsFailure.forEach(action => {
                            if (RuleTree.isManifestEntry(action)) {
                                const followUpEntry = action as RuleTree.ManifestEntry;
                                actionPool.push(applyManifestEntry(endpointObject, followUpEntry, postMode).catch(error => {
                                    Logger.error(error, followUpEntry)
                                }));
                            } else if (RuleTree.isAction(action)) {
                                const actionObject = action as RuleTree.Action;
                                actionPool.push(applyAction(endpointObject, actionObject, entryObject, postMode).catch(error => {
                                    Logger.error(error, actionObject)
                                }));
                            } else {
                                Logger.error("Unexpected action type", action);
                                throw new Error("Unexpected action type " + typeof action)
                            }
                        })
                    } else {
                        Logger.info(endpointObject.endpoint, "No failure actions for ", entryObject.uri)
                    }
                }
                return Promise.allSettled(actionPool).then(() => {
                    AssetTracker.getInstance().setAssetStateToFinished(entryObject.uri, endpointObject.endpoint);
                    Logger.info("Finished actions for ", entryObject.uri, "on endpoint", endpointObject.endpoint)
                }).catch(error => {
                    Logger.error("Error applying generation asset", error);
                });
            })
        } else {
            Logger.info("Skipping asset", entryObject.uri, "for endpoint", endpointObject.endpoint, "because it is already being processed");
            return Promise.resolve();
        }
    })
    AssetTracker.getInstance().setApplicationPromise(entryObject.uri, endpointObject.endpoint, result);

    return result;
}

function applyTest(endpointObject: EndpointObject, testObject: RuleTree.Test, entryObject: RuleTree.ManifestEntry, postMode: boolean ): Promise<boolean> {
    Logger.info("Test ", entryObject.test.uri, "starting on endpoint", endpointObject.endpoint)
    let parser = new sparqljs.Parser();
    let generator = new sparqljs.Generator();
    const startTime = dayjs();
    if (testObject != undefined && RuleTree.isTest(testObject) && !RuleTree.isDummyTest(testObject)) {
        let testQueries = testObject.query;
        let testsPool = [];
        testQueries.forEach(testQuery => {
            testQuery = replacePlaceholders(testQuery, { endpointUrlString: endpointObject.endpoint })
            if (!postMode) {
                // We check if there is a service clause in the query
                if (!SPARQLUtils.queryContainsService(testQuery)) {
                    let endpointUrl = endpointObject.endpoint;

                    // ASK queries are given a CORESE SPARQL service extension parameter for a limit of 1, other wise Corese will send a SELECT LIMIT 1000 or something too high
                    if(SPARQLUtils.isSparqlAsk(testQuery)) {
                        let endpointUrlObject = new URL(endpointUrl);
                        let params = new URLSearchParams(endpointUrlObject.search);
                        
                        //Add a limit of 1 to the ASK query
                        params.append("limit", "1");
                        endpointUrl = endpointUrlObject.toString() + "?" + params.toString();
                    }

                    // If not, we add the service clause
                    testQuery = SPARQLUtils.addServiceClause(testQuery, endpointUrl)
                }
            }
            if (endpointObject.graphs !== undefined) {
                const parsedQuery = parser.parse(testQuery);
                parsedQuery.where = addGraphToInnerQueries(endpointObject, parsedQuery.where);
                testQuery = generator.stringify(parsedQuery);
            }
            if (SPARQLUtils.isSparqlAsk(testQuery)) {
                testsPool.push(sendAskWithTraceHandling(endpointObject.endpoint, testQuery, endpointObject.endpoint, entryObject, startTime).then(askResult => {
                    if (askResult.error !== undefined) {
                        return false;
                    } else {
                        return askResult;
                    }
                }).finally(() => false));
            } else if (SPARQLUtils.isSparqlSelect(testQuery)) {
                testsPool.push(sendSelectWithTraceHandling(endpointObject.endpoint, testQuery, endpointObject.endpoint, entryObject, startTime).then(selectResult => {
                    if (selectResult.error !== undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }).finally(() => false));
            } else if (SPARQLUtils.isSparqlConstruct(testQuery)) {
                testsPool.push(sendConstructWithTraceHandling(endpointObject.endpoint, testQuery, endpointObject.endpoint, entryObject, startTime).then(constructResult => {
                    const result = constructResult !== undefined;
                    constructResult.close();
                    return result;
                }).finally(() => false));
            } else if (SPARQLUtils.isSparqlUpdate(testQuery)) {
                testsPool.push(sendUpdateWithTraceHandling(endpointObject.endpoint, testQuery, endpointObject.endpoint, entryObject, startTime).then(updateResponse => {
                    if (updateResponse.error !== undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }).finally(() => false));
            }
        })
        return Promise.allSettled(testsPool).then(resultPromises => {
            return resultPromises.map(settledObject => {
                if (settledObject.status.localeCompare("fulfilled") == 0) {
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

/**
 * Utility function for pagination. It adds the list of configured graph to the SELECT query found in a SERVICE clause, or create a SELECT query around the content of the SERVICE clause if it doesn't contain one.
 * @param endpointObject - The endpoint object containing the endpoint URL and the graphs to add.
 * @param patterns - The set of patterns to add the graphs to.
 * @param inService - A boolean indicating whether the patterns are in a SERVICE clause.
 * @returns The set of patterns with the graphs added to the inner queries.
 */
function addGraphToInnerQueries(endpointObject: EndpointObject, patterns: any[], inService: boolean = false): any[] {
    let endpointUrl = endpointObject.endpoint;
    let parser = new sparqljs.Parser();
    let result = [];
    patterns.forEach(pattern => {
        // If the pattern is a SELECT or CONSTRUCT query, then we add the pagination to it if it is in a SERVICE clause
        if ((pattern.queryType !== undefined && (pattern.queryType.localeCompare("SELECT") == 0 || pattern.queryType.localeCompare("CONSTRUCT") == 0 || pattern.queryType.localeCompare("ASK") == 0) || (pattern.updateType !== undefined && pattern.updateType.localeCompare("insertdelete") == 0))) {
            // The query is in a SERVICE clause
            if (inService) {
                let rewrittenPattern = pattern;
                rewrittenPattern.where = [
                    {
                        "type": "graph",
                        "patterns": pattern.where,
                        "name": {
                            "termType": "Variable",
                            "value": "graph"
                        }
                    },
                    {
                        "type": "values",
                        "values": endpointObject.graphs.map(graphName => {
                            return {
                                "?graph": {
                                    "termType": "NamedNode",
                                    "value": graphName
                                }
                            }
                        })
                    }
                ];
                result.push(rewrittenPattern);
                // The query is not in a SERVICE clause, then we process its where clause
            } else {
                let rewrittenPattern = pattern;
                rewrittenPattern.where = addGraphToInnerQueries(endpointObject, pattern.where, inService);
                result.push(rewrittenPattern);
            }
            // We process any other query element that contains patterns
        } else if (pattern.patterns !== undefined) {
            // If the pattern is a SERVICE clause to the processed endpoint, then we process its patterns
            if (pattern.type !== undefined && pattern.type.localeCompare("service") == 0 && pattern.name.value.localeCompare(endpointUrl) == 0) {
                let thereAreSelects = searchForSelect(pattern.patterns);
                // If there is a SELECT query in the SERVICE clause, then we add the graphs recursively
                if (thereAreSelects) {
                    let rewrittenPattern = pattern;
                    rewrittenPattern.patterns = addGraphToInnerQueries(endpointObject, pattern.patterns, true);
                    result.push(rewrittenPattern);
                    // If there is no SELECT query in the SERVICE clause, then we add a SELECT query to it and the graphs with it
                } else {
                    let rewrittenPattern = pattern;
                    let templateSelectQuery = parser.parse("SELECT * WHERE { ?s ?p ?o }");
                    templateSelectQuery.where = [
                        {
                            "type": "graph",
                            "patterns": pattern.patterns,
                            "name": {
                                "termType": "Variable",
                                "value": "graph"
                            }
                        },
                        {
                            "type": "values",
                            "values": endpointObject.graphs.map(graphName => {
                                return {
                                    "?graph": {
                                        "termType": "NamedNode",
                                        "value": graphName
                                    }
                                }
                            })
                        }
                    ];
                    rewrittenPattern.patterns = [templateSelectQuery];
                    result.push(rewrittenPattern);
                }
                // Any other pattern is processed
            } else {
                let rewrittenPattern = pattern;
                rewrittenPattern.patterns = addGraphToInnerQueries(endpointObject, pattern.patterns, inService);
                result.push(rewrittenPattern);
            }
        } else {
            result.push(pattern);
        }
    });
    return result
}

/**
 * Utility function for graph insertion and pagination. It detects if there is an inner SELECT query in the given patterns
 * @param patterns 
 * @returns {boolean}
 */
function searchForSelect(patterns: any[]): boolean {
    let result = false;
    patterns.forEach(pattern => {
        if (pattern.queryType !== undefined && (pattern.queryType.localeCompare("SELECT") == 0 || pattern.queryType.localeCompare("CONSTRUCT") == 0)) {
            result = true
        } else {
            if (pattern.patterns !== undefined) {
                result = searchForSelect(pattern.patterns);
            }
        }
    });
    return result
}

/**
 * Applies the given action to the given endpoint object and entry object.
 * @param endpointObject The endpoint object to apply the action to.
 * @param actionObject The action object to apply.
 * @param entryObject The manifest entry object.
 * @param postMode The post mode. In post mode, a service clause toward the endpoint is not added to the query when it is missing.
 * @returns A promise that resolves when the action has been applied.
 */
function applyAction(endpointObject: EndpointObject, actionObject: RuleTree.Action, entryObject: RuleTree.ManifestEntry, postMode): Promise<void> {
    if (AssetTracker.getInstance().hasApplicationPromise(actionObject.uri, endpointObject.endpoint)) {
        return AssetTracker.getInstance().getApplicationPromise(actionObject.uri, endpointObject.endpoint);
    } else {
        AssetTracker.getInstance().setAssetStateToOngoing(actionObject.uri, endpointObject.endpoint);

        let generator = new sparqljs.Generator();
        let parser = new sparqljs.Parser();
        let actionPool = [];
        const startTime = dayjs();
        if (actionObject.endpoint != undefined) {
            endpointObject.endpoint = actionObject.endpoint
        }
        let actionUpdatePromiseArgumentsPool = [];
        let actionConstructPromiseArgumentsPool = [];
        actionObject.action.forEach(queryString => {
            queryString = replacePlaceholders(queryString, { endpointUrlString: endpointObject.endpoint })
            if (!postMode) {
                // We check if there is a service clause in the query and no endpoint is specified
                if (!SPARQLUtils.isSparqlUpdate(queryString) && !SPARQLUtils.queryContainsService(queryString) && actionObject.endpoint === undefined) {
                    // If not, we add the service clause
                    queryString = SPARQLUtils.addServiceClause(queryString, endpointObject.endpoint)
                }
            }
            if (endpointObject.graphs !== undefined) {
                const parsedQuery = parser.parse(queryString);
                if (SPARQLUtils.isSparqlSelect(queryString) || SPARQLUtils.isSparqlAsk(queryString) || SPARQLUtils.isSparqlConstruct(queryString)) {
                    if (parsedQuery.where !== undefined) {
                        parsedQuery.where = addGraphToInnerQueries(endpointObject, parsedQuery.where);
                    }
                } else if (SPARQLUtils.isSparqlUpdate(queryString)) {
                    parsedQuery.updates = addGraphToInnerQueries(endpointObject, parsedQuery.updates);
                }
                queryString = generator.stringify(parsedQuery);
            }
            let actionTimeout = SPARQLUtils.defaultQueryTimeout;
            if (actionObject.timeout != undefined) {
                actionTimeout = actionObject.timeout;
            }

            // Sending the query accordingly
            if (SPARQLUtils.isSparqlUpdate(queryString)) {
                if (actionObject.pagination != undefined && actionObject.pagination > 0) {
                    const pageSize = actionObject.pagination;
                    const paginatedConstructQueriesPromise = paginateUpdateQueryPromise(endpointObject, queryString, pageSize);
                    actionPool.push(paginatedConstructQueriesPromise)
                } else {
                    actionUpdatePromiseArgumentsPool.push([endpointObject.endpoint, queryString, actionTimeout]);
                }
            } else if (SPARQLUtils.isSparqlConstruct(queryString)) {
                actionConstructPromiseArgumentsPool.push([endpointObject.endpoint, queryString, actionTimeout]);
            } else {
                throw new Error("Expecting Update action for " + JSON.stringify(actionObject));
            }
        });

        function updateWithTraceHandling(endpointUrl, queryString, actionTimeout): Promise<void> {
            return sendUpdateWithTraceHandling(endpointUrl, queryString, endpointObject.endpoint, entryObject, startTime, actionTimeout);
        }

        function constructWithTraceHandling(endpointUrl, queryString, actionTimeout): Promise<void> {
            return sendConstructWithTraceHandling(endpointUrl, queryString, endpointObject.endpoint, entryObject, startTime, actionTimeout).then((result) => {
                return IndexUtils.sendStoreContentToIndex(result);
            });
        }

        function searchForLocalReadBGP(patterns: any[]): boolean {
            let result = false;
            patterns.forEach(pattern => {
                if (pattern.type !== undefined && pattern.type.localeCompare("bgp") == 0) {
                    result = true;
                } else if (pattern.type !== undefined && pattern.patterns !== undefined && pattern.type.localeCompare("service") != 0) {
                    result = result || searchForLocalReadBGP(pattern.patterns);
                }
            });
            return result
        }

        /**
         * If the given update query is a federated query, then this function generates a series of paginated CONSTRUCT queries with the same WHERE clause.
         * @param endpoint used to identify SERVICE clause to the indexed endpoint
         * @param updateQuery UPDATE SPARQL query, If it reads the local KB, then the pagination is done using the LOOP feature of Corese, otherwise it is done by decomposing the query in this function
         * @param pageSize number of triples to be retrieved by each paginated query
         */
        function paginateUpdateQueryPromise(endpointObject: EndpointObject, updateQueryString: string, pageSize: number): Promise<any> {
            let endpointUrl = endpointObject.endpoint;
            const parsedQuery = parser.parse(updateQueryString);
            if (SPARQLUtils.isSparqlUpdate(updateQueryString)) {

                // For each GRAPH if the template of an update, generate a CONSTRUCT query followed by an UPDATE query with the data added to the graph
                // For each SERVICE in the WHERE clause of the CONSTRUCT query, generate paginated CONSTRUCT queries, each followed by their own UPDATE query
                type abstractQueryObject = {
                    type: "insert" | "delete",
                    graph?: string,
                    graphNameIsVariable?: boolean,
                    template: any[],
                    where: any[]
                }
                // Graph treatment
                const bogusNamespaceString = "http://bogus.namespace.wimmics/#"
                const bogusGraphNameValuePropertyString = bogusNamespaceString + "value"
                let abstractQueryObjects = [];
                parsedQuery.updates.forEach(update => {
                    if (update.updateType.localeCompare("insertdelete") == 0) {
                        update.insert.forEach(insertElement => {
                            if (insertElement.type.localeCompare("graph") == 0) {
                                if (insertElement.name.termType.localeCompare("Variable") == 0) { // If the name of the graph comes from a variable, then we cannot directly generate a CONSTRUCT query, so we add a triple to the template to retrieve the graph name later
                                    let variableGraphQueryObject = {
                                        type: "insert",
                                        graph: insertElement.name.value,
                                        graphNameIsVariable: true,
                                        template: insertElement.triples,
                                        where: update.where
                                    }
                                    variableGraphQueryObject.template.push({ "subject": { "termType": "NamedNode", "value": bogusNamespaceString + variableGraphQueryObject.graph }, "predicate": { "termType": "NamedNode", "value": bogusGraphNameValuePropertyString }, "object": insertElement.name })
                                    abstractQueryObjects.push(variableGraphQueryObject);
                                } else {
                                    let graphQueryObject = {
                                        type: "insert",
                                        graph: insertElement.name.value,
                                        template: insertElement.triples,
                                        where: update.where
                                    }
                                    abstractQueryObjects.push(graphQueryObject);
                                }
                            } else {
                                let normalQueryObject = {
                                    type: "insert",
                                    template: [insertElement],
                                    where: update.where
                                }
                                abstractQueryObjects.push(normalQueryObject);
                            }
                        });
                        update.delete.forEach(deleteElement => {
                            let deleteAbstractObject = {
                                type: "delete",
                                template: [deleteElement],
                                where: update.where
                            }
                            abstractQueryObjects.push(deleteAbstractObject);
                        });
                    } else {
                        Logger.error("Unsupported update type: ", update)
                        throw new Error("Unsupported update type: " + update.updateType);
                    }
                });

                // Find inner SELECT query to add the pagination to it
                function paginateQuery(object: abstractQueryObject, pageSize: number, iteration: number = 0, offsetMin: number = 0, offsetMax?: number): Promise<any> {
                    if (offsetMax == undefined || (offsetMax > offsetMin && offsetMin + pageSize * iteration < offsetMax && pageSize > 0)) {
                        let queryObject = null;
                        if (object.type.localeCompare("insert") == 0 || object.type.localeCompare("delete") == 0) {
                            queryObject = parser.parse("CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }");
                            queryObject.template = object.template;
                            queryObject.where = object.where;
                        } else {
                            Logger.error("Unsupported abstract query type: ", object)
                            throw new Error("Unsupported abstract query type: " + object.type);
                        }

                        function changeServiceAndSelectPattern(patterns: any[], inService: boolean = false, localRead: boolean = false): any[] {
                            let result = [];
                            patterns.forEach(pattern => {
                                // If the pattern is a SELECT or CONSTRUCT query, then we add the pagination to it if it is in a SERVICE clause
                                if (pattern.queryType !== undefined && (pattern.queryType.localeCompare("SELECT") == 0 || pattern.queryType.localeCompare("CONSTRUCT") == 0)) {
                                    // The query is in a SERVICE clause
                                    if (inService) {
                                        pattern.limit = pageSize;
                                        pattern.offset = offsetMin + iteration * pageSize;
                                        result.push(pattern);
                                        // The query is not in a SERVICE clause, then we process the its where clause
                                    } else {
                                        let rewrittenPattern = pattern;
                                        rewrittenPattern.where = changeServiceAndSelectPattern(pattern.where, inService, localRead);
                                        result.push(rewrittenPattern);
                                    }
                                    // We process any other query element that contains patterns
                                } else if (pattern.patterns !== undefined) {
                                    // If the pattern is a SERVICE clause to the processed endpoint, then we process its patterns
                                    if (pattern.type !== undefined && pattern.type.localeCompare("service") == 0 && pattern.name.value.localeCompare(endpointUrl) == 0) {
                                        // If there is a local read, we use the Corese LOOP feature
                                        if (localRead) {
                                            let rewrittenPattern = pattern;
                                            if (rewrittenPattern.name.value.includes("?")) {
                                                rewrittenPattern.name.value = rewrittenPattern.name.value + "&mode=loop&limit=" + pageSize;
                                            } else {
                                                rewrittenPattern.name.value = rewrittenPattern.name.value + "?mode=loop&limit=" + pageSize;
                                            }
                                            result.push(rewrittenPattern);
                                        } else {
                                            let thereAreSelects = searchForSelect(pattern.patterns);
                                            // If there is a SELECT query in the SERVICE clause, then we add the pagination to it
                                            if (thereAreSelects) {
                                                let rewrittenPattern = pattern;
                                                rewrittenPattern.patterns = changeServiceAndSelectPattern(pattern.patterns, true, localRead);
                                                result.push(rewrittenPattern);
                                                // If there is no SELECT query in the SERVICE clause, then we add a SELECT query to it and the pagination with it
                                            } else {
                                                let rewrittenPattern = pattern;
                                                let templateSelectQuery = parser.parse("SELECT * WHERE { ?s ?p ?o }");
                                                templateSelectQuery.where = pattern.patterns;
                                                templateSelectQuery.limit = pageSize;
                                                templateSelectQuery.offset = offsetMin + iteration * pageSize;
                                                rewrittenPattern.patterns = [templateSelectQuery];
                                                result.push(rewrittenPattern);
                                            }
                                        }
                                        // Any other pattern is processed
                                    } else {
                                        let rewrittenPattern = pattern;
                                        rewrittenPattern.patterns = changeServiceAndSelectPattern(pattern.patterns, inService, localRead);
                                        result.push(rewrittenPattern);
                                    }
                                } else {
                                    result.push(pattern);
                                }
                            });
                            return result
                        }

                        let localReadFlag = searchForLocalReadBGP(queryObject.where);
                        queryObject.where = changeServiceAndSelectPattern(queryObject.where, localReadFlag);

                        let generatedQuery = generator.stringify(queryObject);

                        // We send the paginated CONSTRUCT query
                        return sendConstructWithTraceHandling(endpointUrl, generatedQuery, endpointObject.endpoint, entryObject, startTime).then(constructResult => {
                            if (constructResult !== undefined) {
                                if (constructResult.length > 0) {
                                    let graphName = undefined;
                                    if (object.graph !== undefined) {
                                        if (object.graphNameIsVariable != undefined && object.graphNameIsVariable) {
                                            // The graph name is a variable, so we need to retrieve the bogus triples to find the actual graph name, and delete them afterwards
                                            constructResult.match(constructResult.sym(bogusNamespaceString + object.graph), constructResult.sym(bogusGraphNameValuePropertyString), null).forEach(triple => {
                                                graphName = triple.object.value;
                                            })
                                            if (graphName !== undefined) {
                                                constructResult.removeMatches(constructResult.sym(bogusNamespaceString + object.graph), constructResult.sym(bogusGraphNameValuePropertyString), null);
                                                object.graph = graphName;
                                                object.graphNameIsVariable = false;
                                            } else {
                                                throw new Error("Could not find the graph name for the variable " + object.graph + " " + JSON.stringify(constructResult.match(null, constructResult.sym(bogusGraphNameValuePropertyString), null)));
                                            }
                                        } else if (object.graphNameIsVariable != undefined && !object.graphNameIsVariable) {
                                            // The graph name is not a variable
                                            constructResult.removeMatches(null, constructResult.sym(bogusGraphNameValuePropertyString), null);
                                        }
                                    }
                                    // Generate the INSERT DATA/DELETE DATA from the result of the construct query
                                    return RDFUtils.serializeStoreToNTriplesPromise(constructResult).catch(error => {
                                        Logger.error("Error serializing the construct result to NTriples: ", error);
                                        return "";
                                    }).then(constructResultNTString => {
                                        constructResult.close();
                                        constructResultNTString = RDFUtils.fixCommonTurtleStringErrors(constructResultNTString);
                                        if (object.type.localeCompare("insert") == 0) {
                                            let insertDataQuery = "INSERT DATA { " + constructResultNTString + " }";
                                            if (object.graph != undefined) {
                                                insertDataQuery = "INSERT DATA { GRAPH <" + object.graph + "> { " + constructResultNTString + " } }";
                                            }
                                            return sendUpdateWithTraceHandling(endpointUrl, insertDataQuery, endpointObject.endpoint, entryObject, startTime);
                                        } else if (object.type.localeCompare("delete") == 0) {
                                            let deleteDataQuery = "DELETE DATA { " + constructResultNTString + " }";
                                            if (object.graph != undefined) {
                                                deleteDataQuery = "DELETE DATA { GRAPH <" + object.graph + "> { " + constructResultNTString + " } }";
                                            }
                                            return sendUpdateWithTraceHandling(endpointUrl, deleteDataQuery, endpointObject.endpoint, entryObject, startTime);
                                        }
                                    }).then(() => {
                                        return paginateQuery(object, pageSize, iteration + 1, offsetMin, offsetMax);
                                    })
                                } else {
                                    let endTime = dayjs();
                                    constructResult.close();
                                    return sendFailureReportUpdate(endpointUrl, generatedQuery, endpointObject.endpoint, entryObject, startTime, endTime, "No triples returned by the query");
                                }
                            } else {
                                return paginateQuery(object, pageSize, iteration + 1, offsetMin, offsetMax);
                            }
                        }).catch(error => {
                            Logger.error("Error while paginating the query: ", error);
                            return paginateQuery(object, pageSize / 2, 0, pageSize * iteration, pageSize * (iteration + 1));
                        });
                    }
                }

                return Promise.allSettled(abstractQueryObjects.map(abstractQueryObject => paginateQuery(abstractQueryObject, pageSize)));

            } else {
                throw new Error("Expecting an update query");
            }
        }


        actionPool.push(Global.iterativePromises(actionUpdatePromiseArgumentsPool, updateWithTraceHandling))
        actionPool.push(Global.iterativePromises(actionConstructPromiseArgumentsPool, constructWithTraceHandling))
        let result = Promise.allSettled(actionPool).then(() => {
            AssetTracker.getInstance().setAssetStateToFinished(actionObject.uri, endpointObject.endpoint);
        }).catch(error => {
            Logger.error("Error applying action", error)
        });

        AssetTracker.getInstance().setApplicationPromise(actionObject.uri, endpointObject.endpoint, result);
        return result;
    }
}

