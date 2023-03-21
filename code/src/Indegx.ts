import { coreseServerUrl } from "./CoreseInterface.js";
import { writeFile } from "./GlobalUtils.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import { applyRuleTree } from "./RuleApplication.js";
import { readRules } from "./Rules.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { sendFileToIndex, writeIndex } from "./IndexUtils.js";
process.env["NODE_CONFIG_DIR"] = "./config/";
import config from "config";
import { readdirSync } from 'node:fs';
import { KGI } from "./RDFUtils.js";

let currentConfig = config.get("dev");
let manifest = currentConfig.get("manifest");
let catalog = currentConfig.get("catalog");
let post = currentConfig.get("post");
let nbFetchRetries = currentConfig.get("nbFetchRetries");
let millisecondsBetweenRetries = currentConfig.get("millisecondsBetweenRetries");
let maxConccurentQueries = currentConfig.get("maxConccurentQueries");
let delayMillisecondsTimeForConccurentQuery = currentConfig.get("delayMillisecondsTimeForConccurentQuery");
let defaultQueryTimeout = currentConfig.get("defaultQueryTimeout");
let logFile = currentConfig.get("logFile");
let outputFile = currentConfig.get("outputFile");
let manifestTreeFile = currentConfig.get("manifestJSON");
let postManifestTreeFile = currentConfig.get("postManifestJSON");
let vocabularies = currentConfig.get("vocabularies");
GlobalUtils.setNbFetchRetries(nbFetchRetries);
GlobalUtils.setMillisecondsBetweenRetries(millisecondsBetweenRetries);
GlobalUtils.setMaxConccurentQueries(maxConccurentQueries);
GlobalUtils.setDelayMillisecondsTimeForConccurentQuery(delayMillisecondsTimeForConccurentQuery);
SparqlUtils.setDefaultQueryTimeout(defaultQueryTimeout);
Logger.setLogFileName(logFile);

let vocabularyFileSendingPool = [];
readdirSync(vocabularies).forEach(file => {
    vocabularyFileSendingPool.push(sendFileToIndex("file://" + vocabularies + "/" + file, KGI("vocabularies").value));
})
Promise.allSettled(vocabularyFileSendingPool).then(() => {
    Logger.info("Reading manifest tree ", manifest)
    return readRules(manifest).then(manifests => {
        Logger.info("Manifest tree read")
        if (manifestTreeFile !== undefined && manifestTreeFile !== "") {
            Logger.info("Writing manifest tree to file", manifestTreeFile)
            writeFile(manifestTreeFile, JSON.stringify(manifests))
        }

        Logger.info("Reading catalog", catalog)
        let endpointPool = [];
        return readCatalog(catalog).then(endpointObjectList => {
            Logger.info("Catalog read")
            endpointObjectList.forEach(endpointObject => {
                Logger.info("START", endpointObject.endpoint)
                manifests.forEach(manifest => {
                    Logger.info("Treating endpoint", endpointObject.endpoint);
                    endpointPool.push(applyRuleTree(endpointObject, manifest).then(() => {
                        Logger.info("Endpoint", endpointObject.endpoint, "treated");
                        return;
                    }).catch(error => {
                        Logger.error(error)
                    }).finally(() => {
                        return;
                    }));
                })
            })
        }).catch(error => {
            Logger.error(error)
        }).then(() => {
            return Promise.allSettled(endpointPool).then(() => {
                Logger.info("All endpoints treated")
            });
        })
    }).then(() => {
        if (post !== undefined && post !== "") {
            return readRules(post).then(postManifests => {
                Logger.info("Post manifest tree read.");
                if (postManifestTreeFile !== undefined && postManifestTreeFile !== "") {
                    Logger.info("Writing post manifest tree to file", postManifestTreeFile)
                    writeFile(postManifestTreeFile, JSON.stringify(postManifests))
                }
                Logger.info("Post treatment starts");
                let manifestPool = [];
                postManifests.forEach(postManifest => {
                    manifestPool.push(applyRuleTree({ endpoint: coreseServerUrl }, postManifest));
                })
                return Promise.allSettled(manifestPool).then(() => {
                    Logger.info("Post treatment ends");
                })
            })
        } else {
            Logger.info("No post treatment specified");
            return;
        }
    }).finally(() => {
        return writeIndex(outputFile)
    }).catch(error => { Logger.error(JSON.stringify(error)) });
})