import { coreseServerUrl } from "./CoreseInterface.js";
import * as Logger from "./LogUtils.js"
import { fetchGETPromise, fetchPOSTPromise, writeFile, readFile } from "./GlobalUtils.js";

export function writeIndex(filename): Promise<void> {
    return fetchGETPromise(coreseServerUrl + "?query=" + encodeURIComponent("CONSTRUCT { GRAPH ?g {?s ?p ?o} } WHERE { GRAPH ?g {?s ?p ?o} }") + "&format=trig")
        .then(trig => {
            writeFile(filename, trig)
            Logger.info("IndeGx treatment done")
            return;
        }).catch(error => {
            Logger.error(JSON.stringify(error));
        });
}

export function sendFileToIndex(filename: string, graph?: string): Promise<void> {
    let query = encodeURIComponent("LOAD <" + filename + ">");
    if (graph !== undefined) {
        query = encodeURIComponent("LOAD <" + filename + "> INTO GRAPH <" + graph + ">");
    }
    Logger.log(coreseServerUrl + "?query=" + query)
    return fetchPOSTPromise(coreseServerUrl + "?query=" + query)
        .catch(error => {
            Logger.error(JSON.stringify(error));
        });
}