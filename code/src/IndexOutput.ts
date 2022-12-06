import { sendSelect, coreseDefaultGraphURI, coreseServerUrl, sendConstruct } from "./CoreseInterface.js";
import * as Logger from "./LogUtils.js"
import { fetchGETPromise, writeFile } from "./GlobalUtils.js";
import * as $rdf from "rdflib"
import { createStore, serializeStoreToQuadsPromise, serializeStoreToTriGPromise} from "./RDFUtils.js";

export function writeIndex(filename) {
    return fetchGETPromise( coreseServerUrl + "?query=" + encodeURIComponent("CONSTRUCT { GRAPH ?g {?s ?p ?o} } WHERE { GRAPH ?g {?s ?p ?o} }") + "&format=trig")
        .then(trig => {
            writeFile(filename, trig)
            Logger.info("IndeGx treatment done")
            return;
        }).catch(error => {
            Logger.error(JSON.stringify(error));
        });
    }
