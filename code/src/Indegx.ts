import { coreseDefaultGraphURI, coreseServerUrl, sendAsk, sendConstruct, sendSelect } from "./CoreseInterface.js";
import { writeFile } from "./GlobalUtils.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import { applyRuleTree } from "./RuleApplication.js";
import { readRules } from "./Rules.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { writeIndex } from "./IndexOutput.js";
process.env["NODE_CONFIG_DIR"] = "/user/pmaillot/home/git/IndeGx/code/config/";
import config from "config";

let currentConfig = config.get("dev");
let manifest = currentConfig.get("manifest");
let catalog = currentConfig.get("catalog");
let post = currentConfig.get("catalog");
let nbFetchRetries = currentConfig.get("nbFetchRetries");
let millisecondsBetweenRetries = currentConfig.get("millisecondsBetweenRetries");
let maxConccurentQueries = currentConfig.get("maxConccurentQueries");
let delayMillisecondsTimeForConccurentQuery = currentConfig.get("delayMillisecondsTimeForConccurentQuery");
let defaultQueryTimeout = currentConfig.get("defaultQueryTimeout");
let logFile = currentConfig.get("logFile");
GlobalUtils.setNbFetchRetries(nbFetchRetries);
GlobalUtils.setMillisecondsBetweenRetries(millisecondsBetweenRetries);
GlobalUtils.setMaxConccurentQueries(maxConccurentQueries);
GlobalUtils.setDelayMillisecondsTimeForConccurentQuery(delayMillisecondsTimeForConccurentQuery);
SparqlUtils.setDefaultQueryTimeout(defaultQueryTimeout);
Logger.setLogFileName(logFile);

Logger.info("Reading manifest tree ", manifest)
readRules(manifest).then(manifests => {
    Logger.info("Manifest tree read")
    writeFile("manifestTree.json", JSON.stringify(manifests))

    Logger.info("Reading catalog", catalog)
    let endpointPool = [];
    return readCatalog(catalog).then(endpointList => {
        Logger.info("Catalog read")
        endpointList.forEach(endpoint => {
            Logger.info("START", endpoint)
            manifests.forEach(manifest => {
                Logger.info("Treating endpoint", endpoint);
                endpointPool.push(applyRuleTree(endpoint, manifest).then(() => {
                    Logger.info("Endpoint", endpoint, "treated");
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
    if(post !== undefined && post !== "") {
        return readRules(post).then(manifests => {
            Logger.info("Post manifest tree read.");
            Logger.info("Post treatment starts");
            let manifestPool = [];
            manifests.forEach(manifest => {
                manifestPool.push(applyRuleTree(coreseServerUrl, manifest));
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
    return writeIndex("index.trig")
}).catch(error => { Logger.error(JSON.stringify(error)) });