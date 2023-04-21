import { coreseServerUrl } from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import { KGI } from "./RDFUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import { applyRuleTree } from "./RuleApplication.js";
import { readRules } from "./Rules.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { sendFileToIndex, writeIndex } from "./IndexUtils.js";
import {config} from 'node-config-ts';
import commandLineArgs from 'command-line-args';
import { readdirSync } from 'node:fs';

import commandLineUsage from 'command-line-usage'

const optionDefinitions = [
    { name: 'config', alias: 'c', type: String, defaultOption: true },
    { name: 'help', alias: 'h', type: Boolean },
  ]

type Config = {
    manifest: string,
    catalog: string,
    post: string,
    nbFetchRetries: number,
    millisecondsBetweenRetries: number,
    maxConccurentQueries: number,
    delayMillisecondsTimeForConccurentQuery: number,
    defaultQueryTimeout: number,
    logFile: string,
    outputFile: string,
    manifestJSON: string,
    postManifestJSON: string,
    vocabularies?: string
}

type Option = {
    config: string
    help?: boolean
}

const options: Option = commandLineArgs(optionDefinitions)
if(options.help) {    
    const sections = [
      {
        header: 'IndeGx',
        content: 'Framework for Indexing RDF Knowledge Graphs with SPARQL-based Test Suits.'
      },
      {
        header: 'Options',
        optionList: [
          {
            name: 'config',
            typeLabel: 'String',
            description: 'The key of the config to execute in the config/default.json file.'
          },
          {
            name: 'help',
            description: 'Print this usage guide.'
          }
        ]
      }
    ]
    const usage = commandLineUsage(sections)
    console.log(usage)
    process.exit()
}

let currentConfig: Config = config[options.config];
if(currentConfig === undefined) {
    throw new Error("No config found for " + options.config + " in " + config);
}
    

Logger.info("Using config", options.config);
let manifest: string = currentConfig.manifest;
let catalog: string = currentConfig.catalog;
let post: string = currentConfig.post;
let nbFetchRetries: number = currentConfig.nbFetchRetries;
let millisecondsBetweenRetries: number = currentConfig.millisecondsBetweenRetries;
let maxConccurentQueries: number = currentConfig.maxConccurentQueries;
let delayMillisecondsTimeForConccurentQuery: number = currentConfig.delayMillisecondsTimeForConccurentQuery;
let defaultQueryTimeout: number = currentConfig.defaultQueryTimeout;
let logFile: string = currentConfig.logFile;
let outputFile: string = currentConfig.outputFile;
let manifestTreeFile: string = currentConfig.manifestJSON;
let postManifestTreeFile: string = currentConfig.postManifestJSON;
GlobalUtils.setNbFetchRetries(nbFetchRetries);
GlobalUtils.setMillisecondsBetweenRetries(millisecondsBetweenRetries);
GlobalUtils.setMaxConccurentQueries(maxConccurentQueries);
GlobalUtils.setDelayMillisecondsTimeForConccurentQuery(delayMillisecondsTimeForConccurentQuery);
SparqlUtils.setDefaultQueryTimeout(defaultQueryTimeout);
Logger.setLogFileName(logFile);

let vocabularyFileSendingPool = [];
if(currentConfig.vocabularies !== undefined) {
    let vocabularies = currentConfig.vocabularies;
    if (vocabularies !== undefined && vocabularies !== "") {
        readdirSync(vocabularies).forEach(file => {
            vocabularyFileSendingPool.push(sendFileToIndex("file://" + vocabularies + "/" + file, KGI("vocabularies").value));
        })
    }
}
Promise.allSettled(vocabularyFileSendingPool).then(() => {
    Logger.info("Reading manifest tree ", manifest)
    return readRules(manifest).then(manifests => {
        Logger.info("Manifest tree read")
        if (manifestTreeFile !== undefined && manifestTreeFile !== "") {
            Logger.info("Writing manifest tree to file", manifestTreeFile)
            GlobalUtils.writeFile(manifestTreeFile, JSON.stringify(manifests))
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
                        Logger.error("Error treating endpoint", endpointObject.endpoint, error)
                    }).finally(() => {
                        return;
                    }));
                })
            })
        }).catch(error => {
            Logger.error("Error treating catalog", catalog, error)
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
                    GlobalUtils.writeFile(postManifestTreeFile, JSON.stringify(postManifests))
                }
                Logger.info("Post treatment starts");
                let manifestPool = [];
                postManifests.forEach(postManifest => {
                    manifestPool.push(applyRuleTree({ endpoint: coreseServerUrl }, postManifest, true));
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
    }).catch(error => { 
        Logger.error("During indexation", error);
    });
})