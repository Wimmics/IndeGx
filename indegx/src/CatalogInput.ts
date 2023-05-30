import { createStore, DCAT, rdfTypeProperty, VOID, SD, KGI } from "./RDFUtils.js";
import * as $rdf from "rdflib";
import * as Global from "./GlobalUtils.js";
import * as Logger from "./LogUtils.js";

const voidSparqlEndpointProperty = VOID("sparqlEndpoint");
const sdNamedGraphProperty = SD("namedGraph");

/**
    Represents an object that holds information about an endpoint and optionally its named graphs.
    @typedef {Object} EndpointObject
    @property {string} endpoint - The URL of the SPARQL endpoint.
    @property {string[]|undefined} [graphs] - An optional array of named graphs associated with the endpoint.
    */
export type EndpointObject = {
    endpoint: string,
    graphs?: string[]
}

/**
    Reads a DCAT catalog file and extracts information about SPARQL endpoints and their named graphs.
    @param {string} filename - The path to the DCAT file to read.
    @returns {Promise<EndpointObject[]>} A Promise that resolves to an array of EndpointObject, representing the extracted information.
    */
export function readCatalog(filename: string): Promise<Array<EndpointObject>> {
    let store = createStore()
    return Global.readFile(filename).then(fileContent => {
        let result = [];
        $rdf.parse(fileContent, store, KGI("").value);
        const catalogList = store.statementsMatching(null, rdfTypeProperty, DCAT("Catalog")).map(statement => statement.subject) // List of catalog objects 
        catalogList.forEach(catalog => {
            store.statementsMatching(catalog, DCAT("dataset"), null).forEach(statement => {
                const datasetURI = statement.object;
                if (!$rdf.isLiteral(datasetURI)) {
                    const datasetURIReTyped = datasetURI as $rdf.NamedNode | $rdf.BlankNode | $rdf.Variable;
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