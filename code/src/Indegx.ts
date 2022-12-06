import { coreseDefaultGraphURI, coreseServerUrl, sendAsk, sendConstruct, sendSelect } from "./CoreseInterface.js";
import { writeFile } from "./GlobalUtils.js";
import { applyRuleTree } from "./RuleApplication.js";
import { readRules } from "./Rules.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { writeIndex } from "./IndexOutput.js";

Logger.info("Reading manifest tree")
readRules("/user/pmaillot/home/git/IndeGx/rules/manifest.ttl").then(manifests => {
// readRules("./testManifest.ttl").then(manifests => {
    Logger.info("Manifest tree read")
    writeFile("manifestTree.json", JSON.stringify(manifests))

    Logger.info("Reading catalog")
    var endpointPool = [];
//    return readCatalog("../../catalogs/DBpedia_catalog.ttl").then(endpointList => {
    return readCatalog("testCatalog.ttl").then(endpointList => {
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
    return writeIndex("index.trig")
}).catch(error => { Logger.error(JSON.stringify(error)) });