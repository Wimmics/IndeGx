import { createStore, loadRDFFiles, RDF, MANIFEST, KGI, DCT, loadRDFFile, collectionToArray, urlToBaseURI } from "./RDFUtils.js";
import * as $rdf from "rdflib";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
dayjs.extend(duration);
import * as Logger from "./LogUtils.js";
const manifestType = MANIFEST("Manifest");
const manifestEntryType = MANIFEST("ManifestEntry");
const manifestIncludeProperty = MANIFEST("include");
const manifestEntriesProperty = MANIFEST("entries");
const manifestActionProperty = MANIFEST("action");
const rdfTypeProperty = RDF("type");
const kgiOnSuccessProperty = KGI("onSuccess");
const kgiOnFailureProperty = KGI("onFailure");
const kgiQueryProperty = KGI("query");
const kgiEndpointProperty = KGI("endpoint");
const kgiTimeoutProperty = KGI("timeout");
const kgiPaginationProperty = KGI("recommendedPagination");
const kgiTestQueryType = KGI("TestQuery");
const kgiDummyTestType = KGI("DummyTest");
const dctTitle = DCT("title");
const dctDescription = DCT("description");
/**

    Reads the rules for a given root manifest, saves them to a file, and returns a promise that resolves to an array of Manifest objects. Note: the function is saving the manifests to a JSON file called "manifests.json" using the writeFile function, which is not defined in this code snippet.
    @param {string} rootManifest - The URI of the root manifest.
    @returns {Promise<Manifest[]>} A promise that resolves to an array of Manifest objects.
    */
export function readRules(rootManifest) {
    let store = createStore();
    return readManifest(rootManifest, store).then(manifests => { return manifests; }).finally(() => { return []; });
}
/**
    Reads an RDF manifest file and returns an array of Manifest objects containing information about the entries and included manifests.
    @param {string} manifestFilename - The name of the RDF manifest file to read.
    @param {$rdf.tore} store - The RDF store in which to load the manifest.
    @returns {Promise<Array<Manifest>>} A Promise that resolves with an array of Manifest objects representing the information in the manifest file.
    */
function readManifest(manifestFilename, store) {
    let result = [];
    let baseURI = urlToBaseURI(manifestFilename);
    let manifestURI = manifestFilename;
    if (!(manifestFilename.startsWith("http://") || manifestFilename.startsWith("https://") || manifestFilename.startsWith("file://"))) {
        manifestURI = "file://" + manifestFilename;
        baseURI = "file://" + baseURI;
    }
    return loadRDFFile(manifestFilename, store, baseURI).then(() => {
        const manifestResource = $rdf.namedNode(baseURI);
        let manifestObject = {
            uri: manifestResource.toString(),
            entries: [],
            includes: []
        };
        // Inclusion
        let manifestInclusionReadingPool = [];
        let inclusionCollection = [];
        store.statementsMatching(manifestResource, manifestIncludeProperty, null).map(statement => {
            return statement.object;
        }).forEach(collection => {
            if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                inclusionCollection = inclusionCollection.concat(collectionToArray(collection, store));
            }
        });
        let rdfCollection = inclusionCollection.filter(node => node != undefined && !node.value.includes(manifestResource.value + "#") && !$rdf.isBlankNode(node)).map(node => node.value);
        rdfCollection = [...new Set(rdfCollection)];
        rdfCollection.forEach(inclusionResourceURI => {
            manifestInclusionReadingPool.push(readManifest(inclusionResourceURI, store).then(inclusionManifests => {
                if (manifestObject.includes == undefined) {
                    manifestObject.includes = inclusionManifests;
                }
                else {
                    manifestObject.includes = manifestObject.includes.concat(inclusionManifests);
                }
                return;
            }).catch(error => {
                Logger.error("Error reading", manifestFilename, "error", error);
            }));
        });
        // Entries
        let manifestEntriesReadingPool = [];
        let entriesCollection = store.statementsMatching(manifestResource, manifestEntriesProperty, null).map(statement => statement.object);
        // Logger.log("Entries", entriesCollection.map(node => node.toNT()), "from", manifestResource.toNT())
        let entriesURIArray = [];
        entriesCollection.forEach(collection => {
            if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                entriesURIArray = entriesURIArray.concat(collectionToArray(collection, store).filter(node => !$rdf.isBlankNode(node)).map(node => node.value)).filter(uri => uri != undefined && !uri.includes(manifestResource.value + "#"));
                entriesURIArray = [...new Set(entriesURIArray)];
            }
            else {
                throw new Error("Unexpected node, collection expected: " + collection);
            }
        });
        manifestEntriesReadingPool.push(loadRDFFiles(entriesURIArray, store).then(() => {
            return Promise.allSettled(entriesURIArray.map(entryURI => {
                return readGenerationAsset(entryURI, store).then(generationAsset => {
                    if (manifestObject.entries == undefined) {
                        manifestObject.entries = [generationAsset];
                    }
                    manifestObject.entries.push(generationAsset);
                }).catch(error => {
                    Logger.error("Error reading", entryURI, "error", error);
                });
            }));
        }).catch(error => {
            Logger.error("Error applying entries", entriesURIArray, "from ", manifestFilename, ", error ", error);
        }));
        return Promise.all(manifestInclusionReadingPool).then(() => {
            return Promise.allSettled(manifestEntriesReadingPool).then(() => {
                result.push(manifestObject);
                return result;
            }).catch(error => {
                Logger.error("Error reading", manifestFilename, "error", error);
                throw error;
            });
        });
    });
}
/**
    Reads a generation asset from the given URI using the provided RDF store.
    @param {string} uri - The URI of the generation asset to be read.
    @param {$rdf.Store} store - The RDF store object used to read the generation asset.
    @returns {Promise<ManifestEntry> } - A promise that resolves with a ManifestEntry object representing the generation asset.
    @throws {Error} - Throws an error if there was an error applying the entries.
    */
function readGenerationAsset(uri, store) {
    const generationAssetResource = $rdf.sym(uri);
    let resultGenerationAsset = {
        uri: uri,
        test: { uri: uri },
        actionsSuccess: [],
        actionsFailure: []
    };
    let promisePool = [];
    try {
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
            let gaTest = {
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
                promisePool.push(actionFromCollection(collection, store).then(actions => {
                    resultGenerationAsset.actionsSuccess = resultGenerationAsset.actionsSuccess.concat(actions);
                }).catch(error => {
                    Logger.error("Error extracting the success actions for", generationAssetResource, "error", error);
                }));
            }
        });
        // Failure
        let failureActionsCollection = store.statementsMatching(generationAssetResource, kgiOnFailureProperty, null).map(statement => statement.object);
        failureActionsCollection.forEach(collection => {
            if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
                promisePool.push(actionFromCollection(collection, store).then(actions => {
                    resultGenerationAsset.actionsFailure = resultGenerationAsset.actionsFailure.concat(actions);
                }).catch(error => {
                    Logger.error("Error extracting the failure actions for", generationAssetResource, "error", error);
                }));
            }
        });
    }
    catch (error) {
        Logger.error("Error applying entries", error);
    }
    return Promise.allSettled(promisePool).then(() => resultGenerationAsset);
}
/**
    Given a collection node, returns an array of actions or manifests that can be executed as part of a generation process.
    @param {$rdf.BlankNode | $rdf.NamedNode} collection A BlankNode or NamedNode representing the collection of actions to be executed.
    @param {$rdf.Store} store An $rdf.Store object containing the RDF graph to be queried.
    @returns {Promise<Array<ManifestEntry | Action | Manifest>>} A Promise that resolves to an array of ManifestEntry, Action, or Manifest objects that can be executed.
    */
function actionFromCollection(collection, store) {
    let promisePool = [];
    let result = [];
    if ($rdf.isBlankNode(collection) || $rdf.isNamedNode(collection)) {
        const failureActionsNodeArray = collectionToArray(collection, store);
        failureActionsNodeArray.forEach(node => {
            if (store.holds(node, manifestActionProperty, null)) {
                // Action is a leaf node
                if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                    let actionNode = node;
                    const actionObject = getActionLeafNode(actionNode, store);
                    result.push(actionObject);
                }
            }
            else {
                // Action is a node
                promisePool.push(loadRDFFile(node.value, store).then(() => {
                    if (store.holds(node, RDF("type"), manifestEntryType)) {
                        return readGenerationAsset(node.value, store).then(generationAsset => {
                            result.push(generationAsset);
                            return;
                        });
                    }
                    else if (store.holds(node, RDF("type"), manifestType)) {
                        return readManifest(node.value, store).then(manifestArray => {
                            manifestArray.forEach(manifest => {
                                result.push(manifest);
                            });
                            return;
                        });
                    }
                }).catch(error => {
                    Logger.error("Error reading", node.value, "error", error);
                }));
            }
        });
    }
    return Promise.allSettled(promisePool).then(() => result);
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
function getActionLeafNode(actionNode, store) {
    let actionObject = {
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
    return actionObject;
}
