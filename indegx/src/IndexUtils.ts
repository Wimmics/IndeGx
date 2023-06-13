import { coreseServerUrl } from "./CoreseInterface.js";
import * as Logger from "./LogUtils.js"
import * as Global from "./GlobalUtils.js";
import * as RDFUtils from "./RDFUtils.js";
import * as $rdf from "rdflib";
import * as SPARQLUtils from "./SPARQLUtils.js";


/**
    Queries a Corese server to construct an index graph and writes it to a file with the given filename.
    @param {string} filename - The name of the file to write the index graph to.
    @returns {Promise<void>} A Promise that resolves to void when the index graph is successfully written or rejects with an error if there is a problem.
    */
export function writeIndex(filename: string): Promise<void> {
    return Global.fetchGETPromise(coreseServerUrl + "?query=" + encodeURIComponent("CONSTRUCT { GRAPH ?g {?s ?p ?o} } WHERE { GRAPH ?g {?s ?p ?o} }") + "&format=trig")
        .then(trig => {
            Global.writeFile(filename, RDFUtils.fixCommonTurtleStringErrors(trig))
            Logger.info("IndeGx treatment done")
            return;
        }).catch(error => {
            Logger.error("writing index", filename, error);
        });
}

/**
    Sends a file to the Corese index server.
    @param filename - The name of the file to be sent.
    @param graph - Optional. The name of the graph into which the file will be loaded.
    @returns A Promise that resolves to void when the LOAD query has resolved.
    */
export function sendFileToIndex(filename: string, graph?: string): Promise<void> {
    let query = encodeURIComponent("LOAD <" + filename + ">");
    if (graph !== undefined) {
        query = encodeURIComponent("LOAD <" + filename + "> INTO GRAPH <" + graph + ">");
    }
    return Global.fetchPOSTPromise(coreseServerUrl + "?query=" + query)
        .catch(error => {
            Logger.error("Loading file", filename, error);
        });
}

export function sendStoreContentToIndex(store: $rdf.Store, graph?: string): Promise<void> {
    return RDFUtils.serializeStoreToNTriplesPromise(store).then(trig => {
        if(graph === undefined) {
            return SPARQLUtils.sendUpdateQuery(coreseServerUrl, `INSERT DATA { ${trig} }`)
        } else {
            return SPARQLUtils.sendUpdateQuery(coreseServerUrl, `INSERT DATA { GRAPH <${graph}> { ${trig} } }`)
        }
    })
}