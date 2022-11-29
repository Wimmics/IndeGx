import { sendSelect, coreseDefaultGraphURI, coreseServerUrl, sendConstruct } from "./CoreseInterface.js";
import * as Logger from "./LogUtils.js"
import { fetchGETPromise, writeFile } from "./GlobalUtils.js";
import * as $rdf from "rdflib"
import { createStore, serializeStoreToQuadsPromise, serializeStoreToTriGPromise} from "./RDFUtils.js";

export function writeIndex(filename) {
    return fetchGETPromise( coreseServerUrl + "?query=" + encodeURIComponent("CONSTRUCT { GRAPH ?g {?s ?p ?o} } WHERE { GRAPH ?g {?s ?p ?o} }") + "&format=trig")//sendSelect(coreseServerUrl, "SELECT * { GRAPH ?g { ?s ?p ?o } }", 1000000)
    // .then(queryResult => {
    //     Logger.info(queryResult)
    //     writeFile("rawIndex.json", JSON.stringify(queryResult))
    //     var store = createStore();
    //     if (queryResult.results != undefined) {
    //         if (queryResult.results.bindings != undefined) {
    //             queryResult.results.bindings.forEach(binding => {
    //                 var subject = null;
    //                 if(binding.s.type.localeCompare("uri") == 0) {
    //                     subject = $rdf.sym(binding.s.value);
    //                 } else if(binding.s.type.localeCompare("bnode") == 0) {
    //                     subject = $rdf.blankNode(binding.s.value);
    //                 } else {
    //                     throw new Error("Unkown type of subject of triple: " + binding.s.type);
    //                 }
    //                 const property = $rdf.sym(binding.p.value);
    //                 var object = null;
    //                 if (binding.o.type.localeCompare("uri") == 0) {
    //                     object = $rdf.sym(binding.o.value);
    //                 } else if (binding.o.type.localeCompare("literal") == 0) {
    //                     if (binding.o["xml:lang"] != undefined) {
    //                         object = $rdf.literal(binding.o.value, binding.o["xml:lang"]);
    //                     } else {
    //                         object = $rdf.literal(binding.o.value);
    //                     }
    //                 } else if (binding.o.type.localeCompare("typed-literal") == 0) {
    //                     const datatype = $rdf.sym(binding.o.datatype);
    //                     object = $rdf.literal(binding.o.value, datatype);
    //                 } else if(binding.o.type.localeCompare("bnode") == 0) {
    //                     object = $rdf.blankNode(binding.o.value);
    //                 } else {
    //                     throw new Error("Object type not handled: " + binding.o.type)
    //                 }
    //                 if (binding.g !== undefined && (binding.g.value.localeCompare(coreseDefaultGraphURI) != 0)) {
    //                     const graph = $rdf.sym(binding.g.value);
    //                     store.add(subject, property, object, graph);
    //                 } else {
    //                     store.add(subject, property, object);
    //                 }
    //             })
    //         }
    //     }
    //     return serializeStoreToQuadsPromise(store)
        .then(trig => {
            writeFile(filename, trig)
            Logger.info("IndeGx treatment done")
            return;
        }).catch(error => {
            Logger.error(JSON.stringify(error));
        });
    }
