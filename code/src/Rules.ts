import { Manifest, ManifestEntry, Test, Action } from "./RuleTree.js"
import { createStore, serializeStoreToNTriplesPromise, loadRemoteRDFFiles, EARL, RDF, MANIFEST, KGI, DCT, loadRemoteRDFFile } from "./RDFUtils.js";
import { fetchGETPromise, readFile, urlToBaseURI, writeFile } from "./GlobalUtils.js";
import * as $rdf from "rdflib";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration.js';
dayjs.extend(duration)
import * as Logger from "./LogUtils.js"

const manifestType = MANIFEST("Manifest")
const manifestIncludeProperty = MANIFEST("include")
const manifestEntriesProperty = MANIFEST("entries")
const manifestActionProperty = MANIFEST("action")
const rdfTypeProperty = RDF("type");
const kgiOnSuccessProperty = KGI("onSuccess");
const kgiOnFailureProperty = KGI("onFailure");
const kgiQueryProperty = KGI("query");
const kgiEndpointProperty = KGI("endpoint");
const kgiTimeoutProperty = KGI("timeout");
const kgiTestQueryType = KGI("TestQuery");
const kgiDummyTestType = KGI("DummyTest");

export function readRules(rootManifest: string): Promise<Manifest[]> {
    var store = createStore();
    return readManifest(rootManifest, store).then(manifests => { writeFile("manifests.json", JSON.stringify(manifests)); return manifests }).finally(() => { return [] });
}

function readManifest(manifestFilename: string, store: $rdf.Store): Promise<Array<Manifest>> {
    var result: Array<Manifest> = [];
    var manifestReadingPool = [];
    var baseURI = urlToBaseURI(manifestFilename);
    var manifestURI = manifestFilename;
    if (!(manifestFilename.startsWith("http://") || manifestFilename.startsWith("https://") || manifestFilename.startsWith("file://"))) {
        manifestURI = "file://" + manifestFilename;
        baseURI = "file://" + baseURI;
    }

    return readFile(manifestFilename).then(manifestFileString => {
        $rdf.parse(manifestFileString, store, baseURI);
        const manifestResource = $rdf.sym(manifestURI);
        var manifestObject: Manifest = {
            uri: manifestResource.toString(),
            entries: [],
            includes: []
        }

        // Inclusion
        var inclusionCollection = store.statementsMatching(manifestResource, manifestIncludeProperty, null).map(statement => {
            return statement.object;
        });
        inclusionCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                var rdfCollection = collection as $rdf.Collection;
                rdfCollection.elements.forEach(inclusionResource => {
                    manifestReadingPool.push(readManifest(inclusionResource.value, store).then(inclusionManifests => {
                        if (manifestObject.includes == undefined) {
                            manifestObject.includes = inclusionManifests;
                        } else {
                            manifestObject.includes = manifestObject.includes.concat(inclusionManifests);
                        }
                        return;
                    }).catch(error => {
                        Logger.error(error)
                    }))
                })
            }
        })

        // Entries
        var entriesCollection = store.statementsMatching(manifestResource, manifestEntriesProperty, null).map(statement => statement.object);
        var entriesURIArray = [];
        entriesCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                var rdfCollection = collection as $rdf.Collection;
                entriesURIArray = entriesURIArray.concat(rdfCollection.elements.map(node => node.value))
            }
        })
        manifestReadingPool.push(loadRemoteRDFFiles(entriesURIArray, store).catch(error => {
            Logger.error(error)
        }))

        return Promise.allSettled(manifestReadingPool).then(() => {
            return Promise.allSettled(entriesURIArray.map(entryResource => {
                return readGenerationAsset(entryResource, store).then(generationAsset => {
                    if (manifestObject.entries == undefined) {
                        manifestObject.entries = [generationAsset];
                    }
                    manifestObject.entries.push(generationAsset);
                })
            }))
            
        }).then(() => {
            result.push(manifestObject);
            return result;
        })
    })
}

function readGenerationAsset(uri: string, store: $rdf.Store): Promise<ManifestEntry> {
    const generationAssetResource = $rdf.sym(uri);

    var resultGenerationAsset: ManifestEntry = {
        uri: uri,
        test: { uri: uri },
        actionsSuccess: [],
        actionsFailure: []
    }

    var promisePool = [];
    try {
        // Test
        if (store.holds(generationAssetResource, rdfTypeProperty, kgiTestQueryType)) {
            const sparqlQueries = store.statementsMatching(generationAssetResource, kgiQueryProperty, null).map(statement => statement.object.value);
            var descriptions = [];
            if (store.holds(generationAssetResource, DCT("description"), null)) {
                descriptions = store.statementsMatching(generationAssetResource, DCT("description"), null).map(statement => statement.object.value);
            }
            var titles = [];
            if (store.holds(generationAssetResource, DCT("title"), null)) {
                titles = store.statementsMatching(generationAssetResource, DCT("title"), null).map(statement => statement.object.value);
            }
            var gaTest: Test = {
                uri: generationAssetResource.uri,
                query: sparqlQueries,
                description: descriptions,
                title: titles
            };
            resultGenerationAsset.test = gaTest;
        }

        // Actions
        function getActionLeafNode(actionNode, store) {
            var actionObject: Action = {
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

            return actionObject;
        }
        // Success
        var successActionsCollection = store.statementsMatching(generationAssetResource, kgiOnSuccessProperty, null).map(statement => statement.object);
        successActionsCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                var rdfCollection = collection as $rdf.Collection;
                const successActionsNodeArray = rdfCollection.elements;
                successActionsNodeArray.forEach(node => {
                    if (store.holds(node, manifestActionProperty, null)) {
                        // Action is a leaf node
                        if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                            var actionNode = node;
                            const actionObject = getActionLeafNode(actionNode, store);
                            resultGenerationAsset.actionsSuccess.push(actionObject);
                        } else {
                            throw new Error("Unknown action " + node.toString());
                        }
                    } else {
                        // Action is a node
                        promisePool.push(loadRemoteRDFFile(node.value, store).then(() => {
                            return readGenerationAsset(node.value, store).then(generationAsset => {
                                resultGenerationAsset.actionsSuccess.push(generationAsset);
                                return;
                            })
                        }))
                    }
                })
            }
        })

        // Failure
        var failureActionsCollection = store.statementsMatching(generationAssetResource, kgiOnFailureProperty, null).map(statement => statement.object);
        failureActionsCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                var rdfCollection = collection as $rdf.Collection;
                const failureActionsNodeArray = rdfCollection.elements;
                failureActionsNodeArray.forEach(node => {
                    if (store.holds(node, manifestActionProperty, null)) {
                        // Action is a leaf node
                        if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                            var actionNode = node;
                            const actionObject = getActionLeafNode(actionNode, store);
                            resultGenerationAsset.actionsFailure.push(actionObject);
                        }
                    } else {
                        // Action is a node
                        promisePool.push(loadRemoteRDFFile(node.value, store).then(() => {
                            return readGenerationAsset(node.value, store).then(generationAsset => {
                                resultGenerationAsset.actionsFailure.push(generationAsset);
                                return;
                            })
                        }))
                    }
                })
            }
        })
    } catch (error) {
        Logger.error(error)
    }
    return Promise.allSettled(promisePool).then(() => resultGenerationAsset);
}