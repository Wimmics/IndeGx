import { createStore, DCAT, rdfTypeProperty, VOID, SD, KGI } from "./RDFUtils.js";
import * as $rdf from "rdflib";
import * as fs from 'node:fs/promises';
import * as Logger from "./LogUtils.js";

const voidSparqlEndpointProperty = VOID("sparqlEndpoint");
const sdNamedGraphProperty = SD("namedGraph");

export type EndpointObject = {
    endpoint: string,
    graphs?: string[]
}

export function readCatalog(filename: string)  : Promise<Array<EndpointObject>> {
    let store = createStore()
    return fs.readFile(filename).then(buffer => {
        let result = [];
        let fileContent = buffer.toString();
        $rdf.parse(fileContent, store, KGI("").value);
        const catalogList = store.statementsMatching(null, rdfTypeProperty, DCAT("Catalog")).map(statement => statement.subject) // List of catalog objects 
        catalogList.forEach(catalog => {
            store.statementsMatching(catalog, DCAT("dataset"), null).forEach(statement => {
                const datasetURI = statement.object;
                if(! $rdf.isLiteral(datasetURI)) {
                    const datasetURIReTyped = datasetURI as $rdf.NamedNode | $rdf.BlankNode | $rdf.Variable  ;
                    store.statementsMatching(datasetURIReTyped, voidSparqlEndpointProperty, null).forEach(endpointStatement => {
                        let endpointObject: EndpointObject = {
                            endpoint: endpointStatement.object.value
                        }
                        store.statementsMatching(datasetURIReTyped, sdNamedGraphProperty, null).forEach(graphStatement => {
                            if (!endpointObject.graphs) {
                                endpointObject.graphs = [];
                            }
                            endpointObject.graphs.push(graphStatement.object.value);
                        });
                        result.push(endpointObject);
                    });
                }
            })
        })
        return result;
    });
}