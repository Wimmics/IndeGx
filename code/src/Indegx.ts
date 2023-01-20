import { coreseDefaultGraphURI, coreseServerUrl, sendAsk, sendConstruct, sendSelect } from "./CoreseInterface.js";
import { writeFile } from "./GlobalUtils.js";
import { applyRuleTree } from "./RuleApplication.js";
import { readRules } from "./Rules.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { writeIndex } from "./IndexOutput.js";
process.env["NODE_CONFIG_DIR"] = "/user/pmaillot/home/git/IndeGx/code/config/";
import config from "config";

var currentConfig = config.get("dev");
var manifest = currentConfig.get("manifest");
var catalog = currentConfig.get("catalog");
var post = currentConfig.get("catalog");

Logger.info("Reading manifest tree")
readRules(manifest).then(manifests => {
// readRules("/user/pmaillot/home/git/IndeGx/rules/manifest.ttl").then(manifests => {
// readRules("./testManifest.ttl").then(manifests => {
// readRules("/user/pmaillot/home/git/IndeGx/rules/summary/manifest.ttl").then(manifests => {
    Logger.info("Manifest tree read")
    writeFile("manifestTree.json", JSON.stringify(manifests))

    Logger.info("Reading catalog")
    var endpointPool = [];
    return readCatalog(catalog).then(endpointList => {
    // return readCatalog("../catalogs/DBpedia_catalog.ttl").then(endpointList => {
    // return readCatalog("/user/pmaillot/home/git/IndeGx/catalogs/D2KAB_catalog.ttl").then(endpointList => {
    // return readCatalog("/user/pmaillot/home/git/IndeGx/code/testCatalog.ttl").then(endpointList => {
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
    // return readRules("/user/pmaillot/home/git/IndeGx/post/manifest.ttl").then(manifests => {
    return readRules(post).then(manifests => {
        Logger.info("Post manifest tree read.");
        Logger.info("Post treatment starts");
        var manifestPool = [];
        manifests.forEach(manifest => {
            manifestPool.push(applyRuleTree(coreseServerUrl, manifest));
        })
        return Promise.allSettled(manifestPool).then(() => {
            Logger.info("Post treatment ends");
        })
    })
}).then(() => {
    return writeIndex("index.trig")
}).catch(error => { Logger.error(JSON.stringify(error)) });