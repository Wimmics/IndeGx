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
const kgiPaginationProperty = KGI("recommendedPagination");
const kgiTestQueryType = KGI("TestQuery");
const kgiDummyTestType = KGI("DummyTest");
const dctTitle = DCT("title");
const dctDescription = DCT("description");

export function readRules(rootManifest: string): Promise<Manifest[]> {
    let store = createStore();
    return readManifest(rootManifest, store).then(manifests => { writeFile("manifests.json", JSON.stringify(manifests)); return manifests }).finally(() => { return [] });
}

function readManifest(manifestFilename: string, store: $rdf.Store): Promise<Array<Manifest>> {
    let result: Array<Manifest> = [];
    let manifestReadingPool = [];
    let baseURI = urlToBaseURI(manifestFilename);
    let manifestURI = manifestFilename;
    if (!(manifestFilename.startsWith("http://") || manifestFilename.startsWith("https://") || manifestFilename.startsWith("file://"))) {
        manifestURI = "file://" + manifestFilename;
        baseURI = "file://" + baseURI;
    }

    return readFile(manifestFilename).then(manifestFileString => {
        $rdf.parse(manifestFileString, store, baseURI);
        const manifestResource = $rdf.sym(manifestURI);
        let manifestObject: Manifest = {
            uri: manifestResource.toString(),
            entries: [],
            includes: []
        }

        // Inclusion
        let inclusionCollection = store.statementsMatching(manifestResource, manifestIncludeProperty, null).map(statement => {
            return statement.object;
        });
        inclusionCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                let rdfCollection = collection as $rdf.Collection;
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
        let entriesCollection = store.statementsMatching(manifestResource, manifestEntriesProperty, null).map(statement => statement.object);
        let entriesURIArray = [];
        entriesCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                let rdfCollection = collection as $rdf.Collection;
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

    let resultGenerationAsset: ManifestEntry = {
        uri: uri,
        test: { uri: uri },
        actionsSuccess: [],
        actionsFailure: []
    }

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
            let gaTest: Test = {
                uri: generationAssetResource.uri,
                query: sparqlQueries,
                description: descriptions,
                title: titles
            };
            resultGenerationAsset.test = gaTest;
        }

        // Actions
        function getActionLeafNode(actionNode, store) {
            let actionObject: Action = {
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
            if(store.holds(actionNode, kgiPaginationProperty, null)) {
                const paginationString = store.the(actionNode, kgiPaginationProperty, null).value;
                const pagination = Number.parseInt(paginationString);
                actionObject.pagination = pagination;
            }
            if(store.holds(actionNode, dctTitle, null)) {
                const titles = store.statementsMatching(actionNode, dctTitle, null).map(statement => statement.object.value);
                actionObject.title = titles;
            }

            return actionObject;
        }
        // Success
        let successActionsCollection = store.statementsMatching(generationAssetResource, kgiOnSuccessProperty, null).map(statement => statement.object);
        successActionsCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                let rdfCollection = collection as $rdf.Collection;
                const successActionsNodeArray = rdfCollection.elements;
                successActionsNodeArray.forEach(node => {
                    if (store.holds(node, manifestActionProperty, null)) {
                        // Action is a leaf node
                        if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                            let actionNode = node;
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
        let failureActionsCollection = store.statementsMatching(generationAssetResource, kgiOnFailureProperty, null).map(statement => statement.object);
        failureActionsCollection.forEach(collection => {
            if (collection as $rdf.Collection) {
                let rdfCollection = collection as $rdf.Collection;
                const failureActionsNodeArray = rdfCollection.elements;
                failureActionsNodeArray.forEach(node => {
                    if (store.holds(node, manifestActionProperty, null)) {
                        // Action is a leaf node
                        if ($rdf.isBlankNode(node) || $rdf.isNamedNode(node)) {
                            let actionNode = node;
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