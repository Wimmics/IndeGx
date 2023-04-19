import { coreseServerUrl } from "./CoreseInterface.js";
import * as Logger from "./LogUtils.js"
import { fetchGETPromise, fetchPOSTPromise, writeFile, readFile } from "./GlobalUtils.js";

/**
    Queries a Corese server to construct an index graph and writes it to a file with the given filename.
    @param {string} filename - The name of the file to write the index graph to.
    @returns {Promise<void>} A Promise that resolves to void when the index graph is successfully written or rejects with an error if there is a problem.
    */
export function writeIndex(filename: string): Promise<void> {
    return fetchGETPromise(coreseServerUrl + "?query=" + encodeURIComponent("CONSTRUCT { GRAPH ?g {?s ?p ?o} } WHERE { GRAPH ?g {?s ?p ?o} }") + "&format=trig")
        .then(trig => {
            writeFile(filename, trig)
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
    return fetchPOSTPromise(coreseServerUrl + "?query=" + query)
        .catch(error => {
            Logger.error("Loading file", filename, error);
        });
}