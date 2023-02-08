import * as $rdf from "rdflib";
import { fetchGETPromise, readFile, urlToBaseURI } from "./GlobalUtils.js";
import * as Logger from "./LogUtils.js"

var VOID = $rdf.Namespace("http://rdfs.org/ns/void#");
var XSD = $rdf.Namespace("http://www.w3.org/2001/XMLSchema#");
var DCAT = $rdf.Namespace("http://www.w3.org/ns/dcat#");
var PROV = $rdf.Namespace("http://www.w3.org/ns/prov#");
var SD = $rdf.Namespace("http://www.w3.org/ns/sparql-service-description#");
var DCT = $rdf.Namespace("http://purl.org/dc/terms/");
var PAV = $rdf.Namespace("http://purl.org/pav/");
var RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
var OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
var FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
var SCHEMA = $rdf.Namespace("http://schema.org/");
var DCE = $rdf.Namespace("http://purl.org/dc/elements/1.1/");
var SKOS = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#");
var MOD = $rdf.Namespace("https://w3id.org/mod#");
var EARL = $rdf.Namespace("http://www.w3.org/ns/earl#");
var MANIFEST = $rdf.Namespace("http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#");
var KGI = $rdf.Namespace("http://ns.inria.fr/kg/index#");

export const rdfTypeProperty = RDF("type");

export function createStore() {
    var store = $rdf.graph();
    store.setPrefixForURI("dcat", "http://www.w3.org/ns/dcat#");
    store.setPrefixForURI("ex", "https://e.g/#");
    store.setPrefixForURI("kgi", "https://ns.inria.fr/kg/index#");
    store.setPrefixForURI("sd", "http://www.w3.org/ns/sparql-service-description#");
    store.setPrefixForURI("wimmics", "https://team.inria.fr/wimmics/");
    store.setPrefixForURI("culturefr", "https://www.culture.gouv.fr/");
    store.setPrefixForURI("inria", "https://www.inria.fr/");
    store.setPrefixForURI("dbfr", "http://fr.dbpedia.org/");
    store.setPrefixForURI("cc", "http://creativecommons.org/ns#");
    store.setPrefixForURI("dbo", "http://dbpedia.org/ontology/");
    store.setPrefixForURI("dbfrp", "http://fr.dbpedia.org/property/");
    store.setPrefixForURI("openvoc", "http://open.vocab.org/terms/");
    store.setPrefixForURI("goodrel", "http://purl.org/goodrelations/v1#");
    store.setPrefixForURI("vann", "http://purl.org/vocab/vann/");
    store.setPrefixForURI("voaf", "http://purl.org/vocommons/voaf#");
    store.setPrefixForURI("eclass", "http://www.ebusiness-unibw.org/ontologies/eclass/5.1.4/#");
    store.setPrefixForURI("georss", "http://www.georss.org/georss/");
    store.setPrefixForURI("skos", "http://www.w3.org/2004/02/skos/core#");
    store.setPrefixForURI("powders", "http://www.w3.org/2007/05/powder-s#");
    store.setPrefixForURI("oa", "http://www.w3.org/ns/oa#");
    store.setPrefixForURI("wdentity", "http://www.wikidata.org/entity/");
    store.setPrefixForURI("dbfrg", "http://fr.dbpedia.org/graph/");
    store.setPrefixForURI("localdav", "http://localhost:8890/DAV/");
    store.setPrefixForURI("dbspr", "http://dbpedia.org/schema/property_rules#");
    store.setPrefixForURI("pav", "http://purl.org/pav/");
    store.setPrefixForURI("dce", "http://purl.org/dc/elements/1.1/");
    store.setPrefixForURI("mod", "https://w3id.org/mod#");
    store.setPrefixForURI("dcmitype", "http://purl.org/dc/dcmitype/");
    store.setPrefixForURI("schema", "http://schema.org/");
    return store;
}

export function loadRemoteRDFFile(file: string, store: $rdf.Store): Promise<any> {
    return loadRemoteRDFFiles([file], store);
}

export function loadRemoteRDFFiles(files: Array<string>, store: $rdf.Store): Promise<any> {
    const promiseArray = files.map(filename => readFile(filename).then(manifestFileString => {
        const baseURI = urlToBaseURI(filename);
        const fetcher = new $rdf.Fetcher(store)
        return new Promise<void>((resolve, reject) => {
            try {
                $rdf.parse(manifestFileString, store, baseURI, fetcher.guessContentType(filename), () => { resolve(); });
            } catch (error) {
                reject(error);
            }
        });
    }))
    return Promise.allSettled(promiseArray)
}

export function serializeStoreToTurtlePromise(store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.serialize(null, store, undefined, 'text/turtle', function (err, str) {
            if (err != null) {
                reject(err);
            }
            accept(str)
        }, { namespaces: store.namespaces });
    })
}

export function serializeStoreToNTriplesPromise(store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.serialize(null, store, undefined, 'application/n-triples', function (err, str) {
            if (err != null) {
                reject(err);
            }
            accept(str)
        }, { namespaces: store.namespaces });
    })
}

export function serializeStoreToTriGPromise(store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.serialize(null, store, undefined, 'application/trig', function (err, str) {
            if (err != null) {
                reject(err);
            }
            accept(str)
        }, { namespaces: store.namespaces });
    })
}

export function serializeStoreToQuadsPromise(store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.serialize(null, store, undefined, 'application/nquads', function (err, str) {
            if (err != null) {
                reject(err);
            }
            accept(str)
        }, { namespaces: store.namespaces });
    })
}

export function parseNTriplesToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "application/n-triples", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseN3ToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "text/n3", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseTurtleToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "text/turtle", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseHTMLToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "text/html", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseJSONLDToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "application/ld+json", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseNQuadsToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "application/nquads", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export function parseRDFXMLToStore(content, store: $rdf.Store) {
    return new Promise((accept, reject) => {
        $rdf.parse(content, store, "http://ns.inria.fr/kg/index#", "application/rdf+xml", (err, kb) => {
            if (err != null) {
                reject(err);
            }
            accept(kb);
        })
    });
}

export { RDF, RDFS, OWL, FOAF, SCHEMA, DCE, SKOS, MOD, EARL, VOID, XSD, DCAT, PROV, SD, DCT, PAV, KGI, MANIFEST };