import { coreseServerUrl, sendUpdate } from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import * as RuleApplication from "./RuleApplication.js";
import { readRules } from "./RuleCreation.js";
import { readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { sendStoreContentToIndex, writeIndex } from "./IndexUtils.js";
import * as ReportUtils from "./ReportUtils.js";
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { readFileSync, accessSync } from 'node:fs';
import { createStore, loadRDFFile } from "./RDFUtils.js";

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'resume', alias: 'r', type: Boolean },
    { name: 'config', alias: 'c', type: String, defaultOption: "config/default.json" },
]

type Option = {
    help?: boolean,
    config?: string,
}

const options: Option = commandLineArgs(optionDefinitions)
if (options.help) {
    const sections = [
        {
            header: 'IndeGx',
            content: 'Framework for Indexing RDF Knowledge Graphs with SPARQL-based Test Suits.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'help',
                    alias: 'h',
                    type: Boolean,
                    description: 'Print this usage guide.'
                },
                {
                    name: 'resume',
                    alias: 'r',
                    type: Boolean,
                    description: 'Will reuse the files in the output/tmp/ folders as starting data and test at for each rule and each endpoint if it needs to be re-applied. Useless if query logging has been disabled.'
                },
                {
                    name: 'config',
                    alias: 'c',
                    type: String,
                    typeLabel: '{underline file}',
                    description: 'Configuration file, in JSON format. Default is config/default.json.'
                }
            ]
        },
        {
            content: 'Project home: {underline https://github.com/Wimmics/IndeGx}'
        }
    ]
    const usage = commandLineUsage(sections)
    console.info(usage)
    process.exit()
}
let configFilename: string = "config/default.json";
if (options.config !== undefined) {
    configFilename = options.config;
}

let resumeMode: boolean = false;

type ConfigType = {
    manifest: string,
    catalog: string,
    post?: string,
    pre?: string,
    nbFetchRetries: number,
    millisecondsBetweenRetries: number,
    maxConccurentQueries: number,
    delayMillisecondsTimeForConccurentQuery: number,
    defaultQueryTimeout: number,
    logFile: string,
    outputFile: string,
    manifestJSON: string,
    postManifestJSON: string,
    queryLog?: boolean, // default true, log queries in the index if true. Incompatible with resilience.
    resilience?: boolean, // default false, store the result of the current state of the index in a temporary file if true. Incompatible with disabling query logging.
}

let currentConfig: ConfigType = JSON.parse(readFileSync(configFilename).toString()); // default config
if (currentConfig === undefined) {
    Logger.error("No configuration found in " + configFilename);
    throw new Error("No configuration found in " + configFilename);
}

Logger.info("Using configuration", currentConfig);
let rootManifestFilename: string = currentConfig.manifest;
let catalog: string = currentConfig.catalog;
let post: string = currentConfig.post;
let nbFetchRetries: number = currentConfig.nbFetchRetries;
let millisecondsBetweenRetries: number = currentConfig.millisecondsBetweenRetries;
let maxConccurentQueries: number = currentConfig.maxConccurentQueries;
let delayMillisecondsTimeForConccurentQuery: number = currentConfig.delayMillisecondsTimeForConccurentQuery;
let defaultQueryTimeout: number = currentConfig.defaultQueryTimeout;
let logFile: string = currentConfig.logFile;
let queryLog: boolean = currentConfig.queryLog;
if (queryLog !== undefined) {
    ReportUtils.setLogMode(queryLog);
}
let resilience: boolean = currentConfig.resilience;
if (resilience !== undefined) {
    RuleApplication.setResilienceMode(resilience);
}
if(resilience && !queryLog){
    Logger.error("Resilience mode is useless without query logging. This is probably a mistake in the configuration file.");
}
let outputFile: string = currentConfig.outputFile;
let manifestTreeFile: string = currentConfig.manifestJSON;
let postManifestTreeFile: string = currentConfig.postManifestJSON;
GlobalUtils.setNbFetchRetries(nbFetchRetries);
GlobalUtils.setMillisecondsBetweenRetries(millisecondsBetweenRetries);
GlobalUtils.setMaxConccurentQueries(maxConccurentQueries);
GlobalUtils.setDelayMillisecondsTimeForConccurentQuery(delayMillisecondsTimeForConccurentQuery);
SparqlUtils.setDefaultQueryTimeout(defaultQueryTimeout);
Logger.setLogFileName(logFile);

let initPromise = Promise.resolve();

if (resumeMode) {
    Logger.info("Resuming from previous execution");
    let resumingStore = createStore();

    if (accessSync("tmp/main/" + outputFile) !== undefined) {
        initPromise = loadRDFFile("tmp/main/" + outputFile, resumingStore).then(() => {
            return sendStoreContentToIndex(resumingStore).finally(() => {
                resumingStore.close();
                return;
            });
        })
    } else if (accessSync("tmp/pre/" + outputFile) !== undefined) {
        initPromise = loadRDFFile("tmp/pre/" + outputFile, resumingStore).then(() => {
            return sendStoreContentToIndex(resumingStore).finally(() => {
                resumingStore.close();
                return;
            });
        })
    }
}

if (currentConfig.pre !== undefined) {
    Logger.info("Reading pre-treatment manifest tree")
    let premanifestRoot = currentConfig.pre;
    initPromise.then(() => readRules(premanifestRoot).then(premanifest => {
        Logger.info("Pre-treatment manifest tree read")
        return RuleApplication.applyRuleTree({ endpoint: coreseServerUrl }, premanifest, true).then(() => {
            Logger.info("Pre treatment ends");
        })
    })).finally(() => {
        if (resilience !== undefined && resilience) {
            return writeIndex("tmp/pre/" + outputFile)
        } else {
            return;
        }
    })
}

Logger.info("Reading manifest tree ", rootManifestFilename)
initPromise.then(() => readRules(rootManifestFilename).then(manifest => {
    Logger.info("Manifest tree read")
    if (manifestTreeFile !== undefined && manifestTreeFile !== "") {
        Logger.info("Writing manifest tree to file", manifestTreeFile)
        GlobalUtils.writeFile(manifestTreeFile, JSON.stringify(manifest))
    }

    Logger.info("Reading catalog", catalog)
    let endpointPool = [];
    return readCatalog(catalog).then(endpointObjectList => {
        Logger.info("Catalog read")
        endpointObjectList.forEach(endpointObject => {
            Logger.info("Treating endpoint", endpointObject.endpoint);
            endpointPool.push(RuleApplication.applyRuleTree(endpointObject, manifest).then(() => {
                Logger.info("Endpoint", endpointObject.endpoint, "treated");
                return;
            }).catch(error => {
                Logger.error("Error treating endpoint", endpointObject.endpoint, error)
            }).finally(() => {
                return;
            }));
        })
    }).catch(error => {
        Logger.error("Error treating catalog", catalog, error)
    }).then(() => {
        return Promise.allSettled(endpointPool).then(() => {
            Logger.info("All endpoints treated")
        });
    }).finally(() => {
        if (resilience !== undefined && resilience) {
            return writeIndex("tmp/main/" + outputFile)
        } else {
            return;
        }
    })
}).then(() => {
    if (post !== undefined && post !== "") {
        return readRules(post).then(postManifest => {
            Logger.info("Post manifest tree read.");
            if (postManifestTreeFile !== undefined && postManifestTreeFile !== "") {
                Logger.info("Writing post manifest tree to file", postManifestTreeFile)
                GlobalUtils.writeFile(postManifestTreeFile, JSON.stringify(postManifest))
            }
            Logger.info("Post treatment starts");
            return RuleApplication.applyRuleTree({ endpoint: coreseServerUrl }, postManifest, true).then(() => {
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
}));