import { createStore, DCAT, rdfTypeProperty, serializeStoreToTurtlePromise, VOID } from "./RDFUtils.js";
import * as $rdf from "rdflib";
import * as fs from 'node:fs/promises';
import * as Logger from "./LogUtils.js"

const voidSparqlEndpointProperty = VOID("sparqlEndpoint");

export function readCatalog(filename: string)  : Promise<Array<string>> {
    var store = createStore()
    return fs.readFile(filename).then(buffer => {
        var result = [];
        var fileContent = buffer.toString();
        $rdf.parse(fileContent, store, "http://ns.inria.fr/kg/index#");
        const catalogList = store.statementsMatching(null, rdfTypeProperty, DCAT("Catalog")).map(statement => statement.subject) // List of catalog objects 
        catalogList.forEach(catalog => {
            store.statementsMatching(catalog, DCAT("dataset"), null).forEach(statement => {
                const datasetURI = $rdf.sym(statement.object.value);
                store.statementsMatching(datasetURI, voidSparqlEndpointProperty, null).forEach(endpointStatement => {
                    result.push(endpointStatement.object.value);
                });
            })
        })
        return result;
    });
}