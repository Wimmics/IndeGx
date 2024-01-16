import { Manifest, ManifestEntry, Test, Action, Asset } from "./RuleTree.js"
import { createStore, loadRDFFiles, RDF, MANIFEST, KGI, DCT, loadRDFFile, collectionToArray, urlToBaseURI, urlIsWellFormed, sanitizeUrl } from "./RDFUtils.js";
import * as $rdf from "rdflib";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
dayjs.extend(duration)
import * as Logger from "./LogUtils.js"
import { AssetTracker } from "./AssetTracker.js";

const manifestType = MANIFEST("Manifest")
const manifestEntryType = MANIFEST("ManifestEntry")
const manifestIncludeProperty = MANIFEST("include")
const manifestEntriesProperty = MANIFEST("entries")
const manifestActionProperty = MANIFEST("action")
const rdfTypeProperty = RDF("type");
const kgiOnSuccessProperty = KGI("onSuccess");
const kgiOnFailureProperty = KGI("onFailure");
const kgiRequiredAssetsProperty = KGI("requiredAssets");
const kgiQueryProperty = KGI("query");
const kgiEndpointProperty = KGI("endpoint");
const kgiTimeoutProperty = KGI("timeout");
const kgiPaginationProperty = KGI("recommendedPagination");
const kgiTestQueryType = KGI("TestQuery");
const kgiDummyTestType = KGI("DummyTest");
const dctTitle = DCT("title");
const dctDescription = DCT("description");
/**

    Reads the rules for a given root manifest, saves them to a file, and returns a promise that resolves to a Manifest object. 
    @param {string} rootManifest - The URI of the root manifest.
    @returns {Promise<Manifest[]>} A promise that resolves to a Manifest object.
    */
export function readRules(rootManifest: string): Promise<Manifest> {
    let store = createStore();
    let postPromiseCreationPool: Promise<void>[] = [];
    return readManifest(rootManifest, store, postPromiseCreationPool).then(manifest => {
        return Promise.allSettled(postPromiseCreationPool).then(() => {
            store.close();
            return manifest;
        })
    });
}

/**
 * Checks if a resource is a manifest
 * @param {$rdf.Node} resource URI of the resource
 * @param {$rdf.Store} store 
 * @returns 
 */
export function resourceIsManifest(resource: $rdf.Node, store: $rdf.Store): boolean {
    return store.holds(resource, rdfTypeProperty, manifestType) ||
        store.holds(resource, manifestIncludeProperty, null) ||
        store.holds(resource, manifestEntriesProperty, null);
}

/**
 *  Checks if a resource is a manifest entry
 * @param {$rdf.Node} resource
 * @param {$rdf.Store} store 
 * @returns 
 */
export function resourceIsManifestEntry(resource: $rdf.Node, store: $rdf.Store): boolean {
    return store.holds(resource, rdfTypeProperty, manifestEntryType) ||
        store.holds(resource, rdfTypeProperty, kgiTestQueryType) ||
        store.holds(resource, rdfTypeProperty, kgiDummyTestType) ||
        store.holds(resource, kgiOnSuccessProperty, null) ||
        store.holds(resource, kgiOnFailureProperty, null);
}

/**
 * Checks if a resource is a blank node as rewritten by indeGx
 * @param {$rdf.Node} resource
 * @param {string} baseURI
 * @returns
 */
export function nodeIsIndeGxBlankNode(resource: $rdf.Node, baseURI: string) {
    return $rdf.isBlankNode(resource) || ($rdf.isNamedNode(resource) && resource.value.startsWith(baseURI + "#"));
}

/**
 * Checks if a resource is an action
 * @param {$rdf.Node} resource 
 * @param {$rdf.Store} store
 * @returns
 */
export function resourceIsAction(resource: $rdf.Node, store: $rdf.Store): boolean {
    return store.holds(resource, manifestActionProperty, null);
}

/**
    Reads an RDF manifest file and returns an array of Manifest objects containing information about the entries and included manifests.
    @param {string} manifestFilename - The name of the RDF manifest file to read.
    @param {$rdf.tore} store - The RDF store in which to load the manifest.
    @returns {Promise<Array<Manifest>>} A Promise that resolves with an array of Manifest objects representing the information in the manifest file.
    */
function readManifest(manifestFilename: string, store: $rdf.Store, postPromiseCreationPool: Promise<void>[]): Promise<Manifest> {
    let baseURI = urlToBaseURI(manifestFilename);
    let manifestURI = sanitizeUrl(manifestFilename, baseURI, manifestFilename);
    let promiseCreationPool: Promise<void>[] = [];

    if (AssetTracker.getInstance().hasAsset(manifestURI)) {
        let manifest = AssetTracker.getInstance().getAsset(manifestURI) as Manifest;
        return Promise.resolve(manifest);
    } else {
        return loadRDFFile(manifestFilename, store, baseURI)
            .then(() => {
                const manifestResource = $rdf.namedNode(manifestURI);
                let manifestObject: Manifest = {
                    uri: manifestResource.value,
                    entries: [],
                    includes: [],
                    requiredAssets: []
                }
                // Requirements

                // Required assets
                let requiredAssetsCollection = store.statementsMatching(manifestResource, kgiRequiredAssetsProperty, null).map(statement => statement.object);
                requiredAssetsCollection.forEach(collection => {
                    if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                        collectionToArray(collection, store).forEach(node => {
                            if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                                let requiredAsset = node as $rdf.BlankNode | $rdf.NamedNode;
                                manifestObject.requiredAssets.push(requiredAsset.value);
                                postPromiseCreationPool.push(loadRDFFile(requiredAsset.value, store)
                                    .then(() => {
                                        if (store.holds(requiredAsset, RDF("type"), manifestEntryType)) {
                                            return (readManifestEntry(requiredAsset.value, store, postPromiseCreationPool) as Promise<Asset>).then(asset => {
                                                AssetTracker.getInstance().addAsset(asset);
                                                return Promise.resolve();
                                            })
                                        } else if (store.holds(requiredAsset, RDF("type"), manifestType)) {
                                            return (readManifest(requiredAsset.value, store, postPromiseCreationPool) as Promise<Asset>).then(asset => {
                                                AssetTracker.getInstance().addAsset(asset);
                                                return Promise.resolve();
                                            })
                                        } else {
                                            throw new Error("Unexpected node type: " + requiredAsset.value);
                                        }
                                    }))
                            } else {
                                throw new Error("Unexpected node, asset collection expected: " + collection + " " + node);
                            }
                        })
                    }
                });

                // Inclusion
                let inclusionCollection = []
                store.statementsMatching(manifestResource, manifestIncludeProperty, null).map(statement => {
                    return statement.object;
                }).forEach(collection => {
                    if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                        inclusionCollection = inclusionCollection.concat(collectionToArray(collection, store));
                    }
                });
                let rdfCollection = inclusionCollection.filter(node => node != undefined && !nodeIsIndeGxBlankNode(node, baseURI)).map(node => node.value);
                rdfCollection = [...new Set(rdfCollection)]
                rdfCollection.forEach(inclusionResourceURI => {
                    if (AssetTracker.getInstance().hasAsset(inclusionResourceURI)) {
                        manifestObject.includes.push(AssetTracker.getInstance().getAsset(inclusionResourceURI));
                    } else {
                        let inclusionPromise = loadRDFFile(inclusionResourceURI, store)
                            .then(() => {
                                return readManifest(inclusionResourceURI, store, postPromiseCreationPool)
                                    .then(inclusion => {
                                        manifestObject.includes.push(inclusion);
                                    })
                            })
                        promiseCreationPool.push(inclusionPromise);
                    }
                })


                // Entries
                let entriesCollection = store.statementsMatching(manifestResource, manifestEntriesProperty, null).map(statement => statement.object);
                let entriesURIArray: string[] = [];
                entriesCollection.forEach(collection => {
                    if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                        entriesURIArray = entriesURIArray.concat(collectionToArray(collection, store).filter(node => !nodeIsIndeGxBlankNode(node, baseURI)).map(node => node.value)).filter(uri => uri != undefined);
                        entriesURIArray = [...new Set(entriesURIArray)]
                    } else {
                        throw new Error("Unexpected node, collection expected: " + collection);
                    }
                })
                // Adding the entries that have been read elsewhere
                entriesURIArray.filter(entryUri => AssetTracker.getInstance().hasAsset(entryUri)).forEach(entryUri => {
                    manifestObject.entries.push(AssetTracker.getInstance().getAsset(entryUri) as ManifestEntry);
                });
                // Adding the entries that have not been read yet
                let unknowEntries = entriesURIArray.filter(entryUri => !AssetTracker.getInstance().hasAsset(entryUri));
                unknowEntries.forEach(entryUri => {
                    let entryPromise = loadRDFFile(entryUri, store)
                        .then(() => {
                            return readManifestEntry(entryUri, store, postPromiseCreationPool)
                                .then(entry => {
                                    manifestObject.entries.push(entry);
                                    return Promise.resolve();
                                })
                        })
                    promiseCreationPool.push(entryPromise);
                })

                return Promise.allSettled(promiseCreationPool)
                    .then(() => {
                        AssetTracker.getInstance().addAsset(manifestObject);
                        Logger.info("Manifest read", manifestObject.uri);
                        return manifestObject;
                    }).catch(error => {
                        Logger.error("Error reading manifest", error);
                        throw error;
                    })
            })
    }
}

/**
    Reads a manifest entry from the given URI using the provided RDF store.
    @param {string} uri - The URI of the generation asset to be read.
    @param {$rdf.Store} store - The RDF store object used to read the generation asset.
    @returns {Promise<ManifestEntry> } - A promise that resolves with a ManifestEntry object representing the generation asset.
    @throws {Error} - Throws an error if there was an error applying the entries.
    */
function readManifestEntry(uri: string, store: $rdf.Store, postPromiseCreationPool: Promise<void>[]): Promise<ManifestEntry> {
    const generationAssetResource = $rdf.sym(uri);
    const baseUri = urlToBaseURI(uri);
    let promiseCreationPool: Promise<void>[] = [];

    if (AssetTracker.getInstance().hasAsset(uri)) {
        return Promise.resolve(AssetTracker.getInstance().getAsset(uri) as ManifestEntry);
    } else {
        let resultGenerationAsset: ManifestEntry = {
            uri: uri,
            test: { uri: uri },
            actionsSuccess: [],
            actionsFailure: [],
            requiredAssets: []
        }

        try {
            // Requirements

            // Required assets
            let requiredAssetsCollection = store.statementsMatching(generationAssetResource, kgiRequiredAssetsProperty, null).map(statement => statement.object);
            requiredAssetsCollection.forEach(collection => {
                if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                    collectionToArray(collection, store).forEach(node => {
                        if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                            let requiredAsset = node as $rdf.BlankNode | $rdf.NamedNode;
                            resultGenerationAsset.requiredAssets.push(requiredAsset.value);
                            postPromiseCreationPool.push(loadRDFFile(requiredAsset.value, store)
                                .then(() => {
                                    if (store.holds(requiredAsset, RDF("type"), manifestEntryType)) {
                                        return (readManifestEntry(requiredAsset.value, store, postPromiseCreationPool) as Promise<Asset>).then(asset => {
                                            AssetTracker.getInstance().addAsset(asset);
                                            return Promise.resolve();
                                        })
                                    } else if (store.holds(requiredAsset, RDF("type"), manifestType)) {
                                        return (readManifest(requiredAsset.value, store, postPromiseCreationPool) as Promise<Asset>).then(asset => {
                                            AssetTracker.getInstance().addAsset(asset);
                                            return Promise.resolve();
                                        })
                                    } else {
                                        throw new Error("Unexpected node type: " + requiredAsset.value);
                                    }
                                }))
                        } else {
                            throw new Error("Unexpected node, asset collection expected: " + collection + " " + node);
                        }
                    })
                }
            });

            // Test
            if (store.holds(generationAssetResource, rdfTypeProperty, kgiTestQueryType)) {
                const sparqlQueries = store.statementsMatching(generationAssetResource, kgiQueryProperty, null).map(statement => statement.object.value);
                let descriptions = [];
                if (store.holds(generationAssetResource, dctDescription, null)) {
                    descriptions = store.statementsMatching(generationAssetResource, dctDescription, null).map(statement => statement.object.value);
                }
                let titles = [];
                if (store.holds(generationAssetResource, dctTitle, null)) {
                    titles = store.statementsMatching(generationAssetResource, dctTitle, null).map(statement => statement.object.value);
                }
                let gaTest: Test = {
                    uri: generationAssetResource.uri,
                    query: sparqlQueries,
                    description: descriptions,
                    title: titles
                };
                resultGenerationAsset.test = gaTest;
            }

            // Actions

            // Success
            let successActionsCollection = store.statementsMatching(generationAssetResource, kgiOnSuccessProperty, null).map(statement => statement.object);
            successActionsCollection.forEach(collection => {
                if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                    let actions = actionFromCollection(collection, store, resultGenerationAsset, postPromiseCreationPool).then(actions => {
                        resultGenerationAsset.actionsSuccess = resultGenerationAsset.actionsSuccess.concat(actions);
                    });
                    promiseCreationPool.push(actions);
                }
            })

            // Failure
            let failureActionsCollection = store.statementsMatching(generationAssetResource, kgiOnFailureProperty, null).map(statement => statement.object);
            failureActionsCollection.forEach(collection => {
                if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                    let actions = actionFromCollection(collection, store, resultGenerationAsset, postPromiseCreationPool).then(actions => {
                        resultGenerationAsset.actionsFailure = resultGenerationAsset.actionsFailure.concat(actions);
                    });
                    promiseCreationPool.push(actions);
                }
            })
        } catch (error) {
            Logger.error("Error applying entries", error);
        }

        let result = Promise.allSettled(promiseCreationPool).then(() => resultGenerationAsset).then(entry => {
            AssetTracker.getInstance().addAsset(entry);
            Logger.info("Manifest entry read", entry.uri);
            return entry;
        });
        return result;
    }
}

/**
    Given a collection node, returns an array of actions or manifests that can be executed as part of a generation process.
    @param {$rdf.BlankNode | $rdf.NamedNode} collection A BlankNode or NamedNode representing the collection of actions to be executed.
    @param {$rdf.Store} store An $rdf.Store object containing the RDF graph to be queried.
    @returns {Promise<Array<ManifestEntry | Action | Manifest>>} A Promise that resolves to an array of ManifestEntry, Action, or Manifest objects that can be executed.
    */
function actionFromCollection(collection: $rdf.BlankNode | $rdf.NamedNode, store: $rdf.Store, entry: ManifestEntry, postPromiseCreationPool: Promise<void>[]): Promise<Asset[]> {
    let result: Asset[] = [];
    let promiseCreationPool: Promise<void>[] = [];
    if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
        const actionsNodeArray = collectionToArray(collection, store);
        let actionCount = 0;
        actionsNodeArray.forEach(node => {
            if (store.holds(node, manifestActionProperty, null)) {
                // Action is a leaf node
                if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                    let actionNode = node as $rdf.BlankNode | $rdf.NamedNode;
                    const actionObject = getActionLeafNode(actionNode, store);
                    actionObject.uri = entry.uri + `#${actionCount}`;
                    actionCount++;
                    const newActionNode = $rdf.namedNode(actionObject.uri);
                    store.statementsMatching(node, null, null).forEach(nodeSubjectStatement => {
                        store.add(newActionNode, nodeSubjectStatement.predicate, nodeSubjectStatement.object);
                        store.remove(nodeSubjectStatement);
                    });
                    store.statementsMatching( null, null, node).forEach(nodeObjectStatement => {
                        store.add(nodeObjectStatement.subject, nodeObjectStatement.predicate, newActionNode);
                        store.remove(nodeObjectStatement);
                    });
                    result.push(actionObject);
                }
            } else {
                // Action is a node
                if (AssetTracker.getInstance().hasAsset(node.value)) {
                    result.push(AssetTracker.getInstance().getAsset(node.value) as Asset);
                } else {
                    let actionPromise: Promise<void> = loadRDFFile(node.value, store)
                        .then(() => {
                            if (store.holds(node, RDF("type"), manifestEntryType)) {
                                return readManifestEntry(node.value, store, postPromiseCreationPool) as Promise<Asset>
                            } else if (store.holds(node, RDF("type"), manifestType)) {
                                return readManifest(node.value, store, postPromiseCreationPool) as Promise<Asset>
                            } else {
                                throw new Error("Unexpected node type: " + node.value);
                            }
                        })
                        .then(asset => {
                            result.push(asset);
                            return Promise.resolve();
                        })
                        .catch(error => {
                            Logger.error("Error reading action", error);
                            throw error;
                        })
                    promiseCreationPool.push(actionPromise);
                }
            }
        })
    }
    return Promise.allSettled(promiseCreationPool).then(() => result);
}

/**
    Parses the given actionNode from the RDF store to create an Action object
    containing information about the action to be performed.
    @param {rdf.BlankNode | rdf.NamedNode} actionNode - The node representing the action to be performed
    @param {rdf.Store} store - The RDF store containing the actionNode and other related data
    @returns {Action} - An object containing information about the action to be performed
        action: An array of SPARQL test queries to be performed
        endpoint (optional): The URL of the endpoint where the SPARQL queries are to be executed
        timeout (optional): The maximum time allowed for the queries to run in seconds
        pagination (optional): The number of results to be returned per page of results
        title (optional): The title of the action, as specified in the RDF store
*/
function getActionLeafNode(actionNode: $rdf.BlankNode | $rdf.NamedNode, store: $rdf.Store): Action {
    let actionObject: Action = {
        uri: actionNode.value,
        action: []
    };
    const sparqlTestQueries = store.statementsMatching(actionNode, manifestActionProperty, null).map(statement => statement.object.value);
    actionObject.action = sparqlTestQueries;
    if (store.holds(actionNode, kgiEndpointProperty, null)) {
        const endpointUrl = store.the(actionNode, kgiEndpointProperty, null).value;
        actionObject.endpoint = endpointUrl;
    }
    if (store.holds(actionNode, kgiTimeoutProperty, null)) {
        const timeoutString = store.the(actionNode, kgiTimeoutProperty, null).value;
        const timeout = dayjs.duration(timeoutString);
        actionObject.timeout = timeout.asSeconds();
    }
    if (store.holds(actionNode, kgiPaginationProperty, null)) {
        const paginationString = store.the(actionNode, kgiPaginationProperty, null).value;
        const pagination = Number.parseInt(paginationString);
        actionObject.pagination = pagination;
    }
    if (store.holds(actionNode, dctTitle, null)) {
        const titles = store.statementsMatching(actionNode, dctTitle, null).map(statement => statement.object.value);
        actionObject.title = titles;
    }

    AssetTracker.getInstance().addAsset(actionObject);
    return actionObject;
}