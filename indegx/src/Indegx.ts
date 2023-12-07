import { coreseServerUrl, sendUpdate } from "./CoreseInterface.js";
import * as GlobalUtils from "./GlobalUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import * as RuleApplication from "./RuleApplication.js";
import { readRules } from "./RuleCreation.js";
import { EndpointObject, readCatalog } from "./CatalogInput.js";
import * as Logger from "./LogUtils.js"
import { sendStoreContentToIndex, writeIndex } from "./IndexUtils.js";
import * as ReportUtils from "./ReportUtils.js";
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import { readFileSync, accessSync } from 'node:fs';
import { createStore, loadRDFFile } from "./RDFUtils.js";
import { Manifest } from "./RuleTree.js";
import md5 from "md5"


const defaultConfigFilename = "/config/default.json";
const mainTmpIndexSaveFilename = "/output/tmp/main/indeg.trig";
const mainTmpIndexSaveFilenamePrefix = "/output/tmp/main/indegx_";
const mainTmpIndexSaveFilenameSuffix = ".trig";
const preTmpIndexSaveFilename = "/output/tmp/pre/indeg.trig";

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'resume', alias: 'r', type: Boolean },
    { name: 'config', alias: 'c', type: String, defaultOption: defaultConfigFilename },
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
                    description: 'Will reuse the files in the output/tmp/ folders as starting data and test for each rule and each endpoint if it needs to be re-applied. Useless if query logging has been disabled.'
                },
                {
                    name: 'config',
                    alias: 'c',
                    type: String,
                    typeLabel: '{underline file}',
                    description: `Configuration file, in JSON format. Default is ${defaultConfigFilename}.`
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
let configFilename: string = defaultConfigFilename;
if (options.config !== undefined) {
    configFilename = options.config;
}

let resumeMode: boolean = false;

type ConfigType = {
    manifest: string,
    catalog: string,
    post?: string,
    pre?: string,
    nbFetchRetries?: number,
    millisecondsBetweenRetries: number,
    maxConccurentQueries: number,
    delayMillisecondsTimeForConccurentQuery: number,
    defaultQueryTimeout: number,
    logFile: string,
    outputFile: string,
    manifestJSON?: string,
    postManifestJSON?: string,
    queryLog?: boolean, // default true, log queries in the index if true. Incompatible with resilience.
    resilience?: boolean, // default false, store the result of the current state of the index in a temporary file if true. Incompatible with disabling query logging.
    catalogBinSize: number // default 0. 0 or lower process all endpoints at a the same time. any value n superior to zero will make IndeGx process only n endpoints at a time
}

let currentConfig: ConfigType = JSON.parse(readFileSync(configFilename).toString()); // default config
if (currentConfig === undefined) {
    Logger.error("No configuration found in " + configFilename);
    throw new Error("No configuration found in " + configFilename);
}

let logFile: string = currentConfig.logFile;
if(logFile !== undefined) {
    Logger.setLogFileName(logFile);
}

Logger.info("Using configuration", currentConfig);
let rootManifestFilename: string = currentConfig.manifest;
let catalog: string = currentConfig.catalog;
let post: string = currentConfig.post;
let nbFetchRetries: number = currentConfig.nbFetchRetries;
if (nbFetchRetries !== undefined) {
    GlobalUtils.setNbFetchRetries(nbFetchRetries);
}
let millisecondsBetweenRetries: number = currentConfig.millisecondsBetweenRetries;
if(millisecondsBetweenRetries !== undefined) {
    GlobalUtils.setMillisecondsBetweenRetries(millisecondsBetweenRetries);
}
let maxConccurentQueries: number = currentConfig.maxConccurentQueries;
if (maxConccurentQueries !== undefined) {
    GlobalUtils.setMaxConccurentQueries(maxConccurentQueries);
}
let delayMillisecondsTimeForConccurentQuery: number = currentConfig.delayMillisecondsTimeForConccurentQuery;
if(delayMillisecondsTimeForConccurentQuery !== undefined) {
    GlobalUtils.setDelayMillisecondsTimeForConccurentQuery(delayMillisecondsTimeForConccurentQuery);
}
let defaultQueryTimeout: number = currentConfig.defaultQueryTimeout;
if (defaultQueryTimeout !== undefined) {
    SparqlUtils.setDefaultQueryTimeout(defaultQueryTimeout);
}
let queryLog: boolean = currentConfig.queryLog;
if (queryLog !== undefined) {
    ReportUtils.setLogMode(queryLog);
}
let resilience: boolean = currentConfig.resilience;
if (resilience !== undefined) {
    RuleApplication.setResilienceMode(resilience);
}
if (resilience && !queryLog) {
    Logger.error("Resilience mode is useless without query logging. This is probably a mistake in the configuration file.");
}
let catalogBinSize = currentConfig.catalogBinSize;
if (catalogBinSize === undefined || catalogBinSize <= 0) {
    catalogBinSize = 0;
}
let outputFile: string = currentConfig.outputFile;
let manifestTreeFile: string = currentConfig.manifestJSON;
let postManifestTreeFile: string = currentConfig.postManifestJSON;
Logger.setLogFileName(logFile);

function indegxProcess(): Promise<void> {

    function preProcess(): Promise<void> {
        let initPromise = Promise.resolve();

        if (resumeMode) {
            Logger.info("Resuming from previous execution");
            let resumingStore = createStore();

            if (accessSync(mainTmpIndexSaveFilename) !== undefined) {
                initPromise = loadRDFFile(mainTmpIndexSaveFilename, resumingStore).then(() => {
                    return sendStoreContentToIndex(resumingStore).finally(() => {
                        resumingStore.close();
                        return;
                    });
                })
            } else if (accessSync(preTmpIndexSaveFilename) !== undefined) {
                initPromise = loadRDFFile(preTmpIndexSaveFilename, resumingStore).then(() => {
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
                    return writeIndex(preTmpIndexSaveFilename)
                } else {
                    return;
                }
            })
        }
        return initPromise;
    }

    function postProcess(): Promise<void> {
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
    }

    function process(endpointObjectList: EndpointObject[], manifest: Manifest, recursive = false): Promise<void> {
        let endpointPool = [];

        function processEndpoint(endpointObject, manifest): Promise<void> {
            return Promise.resolve().then(() => {
                Logger.info("Treating endpoint", endpointObject.endpoint);
                return RuleApplication.applyRuleTree(endpointObject, manifest).then(() => {
                    Logger.info("Endpoint", endpointObject.endpoint, "treated");
                    return;
                }).catch(error => {
                    Logger.error("Error treating endpoint", endpointObject.endpoint, error)
                }).finally(() => {
                    return;
                });
            })
        }

        return Promise.resolve().then(() => {
            if (catalogBinSize == 0 || recursive) {
                endpointObjectList.forEach(endpointObject => {
                    endpointPool.push(processEndpoint(endpointObject, manifest));
                })
            } else {
                let slices = [];
                for (let start = 0; start < endpointObjectList.length; start += catalogBinSize) {
                    slices.push(endpointObjectList.slice(start, start + catalogBinSize))
                }
                let iterativeProcessArgs = slices.map(chunkEndpointList => [chunkEndpointList, manifest, true])
                endpointPool.push(GlobalUtils.iterativePromises(iterativeProcessArgs, process))
            }
            return;
        }).then(() => {
            return Promise.allSettled(endpointPool).then(() => {
                Logger.info("All endpoints treated")
            });
        }).catch(error => {
            Logger.error("Error treating catalog", catalog, error)
        }).finally(() => {
            if ((resilience !== undefined && resilience) || recursive) {
                let tmpIndexFilename = mainTmpIndexSaveFilename;
                if(recursive) {
                    let endpointListId = md5(endpointObjectList.map(endpointObject => endpointObject.endpoint).toString());
                    tmpIndexFilename = mainTmpIndexSaveFilenamePrefix + endpointListId + mainTmpIndexSaveFilenameSuffix;
                }
                return writeIndex(tmpIndexFilename)
            } else {
                return;
            }
        })
    }

    let preProcessPromise = preProcess();

    Logger.info("Reading manifest tree ", rootManifestFilename)
    return preProcessPromise.then(() => readRules(rootManifestFilename).then(manifest => {
        Logger.info("Manifest tree read")
        if (manifestTreeFile !== undefined && manifestTreeFile !== "") {
            Logger.info("Writing manifest tree to file", manifestTreeFile)
            GlobalUtils.writeFile(manifestTreeFile, JSON.stringify(manifest))
        }

        Logger.info("Reading catalog", catalog)
        return readCatalog(catalog).then(endpointObjectList => {
            Logger.info("Catalog read")
            let processPromise = process(endpointObjectList, manifest);
            return processPromise;
        })
    }).then(() => {
        let postProcessPromise = postProcess();
        return postProcessPromise;
    }).finally(() => {
        return writeIndex(outputFile)
    }).catch(error => {
        Logger.error("During indexation", error);
    }));
}

indegxProcess();