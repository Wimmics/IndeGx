import * as $rdf from "rdflib";
import { readFile, urlToBaseURI } from "./GlobalUtils.js";
import * as Global from "./GlobalUtils.js";
import * as Logger from "./LogUtils.js"

export const VOID = $rdf.Namespace("http://rdfs.org/ns/void#");
export const XSD = $rdf.Namespace("http://www.w3.org/2001/XMLSchema#");
export const DCAT = $rdf.Namespace("http://www.w3.org/ns/dcat#");
export const PROV = $rdf.Namespace("http://www.w3.org/ns/prov#");
export const SD = $rdf.Namespace("http://www.w3.org/ns/sparql-service-description#");
export const DCT = $rdf.Namespace("http://purl.org/dc/terms/");
export const PAV = $rdf.Namespace("http://purl.org/pav/");
export const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
export const RDFS = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
export const OWL = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
export const FOAF = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
export const SCHEMA = $rdf.Namespace("http://schema.org/");
export const DCE = $rdf.Namespace("http://purl.org/dc/elements/1.1/");
export const SKOS = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#");
export const MOD = $rdf.Namespace("https://w3id.org/mod#");
export const EARL = $rdf.Namespace("http://www.w3.org/ns/earl#");
export const MANIFEST = $rdf.Namespace("http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#");
export const KGI = $rdf.Namespace("http://ns.inria.fr/kg/index#");

export const rdfTypeProperty = RDF("type");

export function createStore() {
    let store = $rdf.graph();
    store.setPrefixForURI("dcat", "http://www.w3.org/ns/dcat#");
    store.setPrefixForURI("ex", "https://e.g/#");
    store.setPrefixForURI("kgi", "http://ns.inria.fr/kg/index#");
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

export function serializeStoreToTurtlePromise(store: $rdf.Store): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, KGI("").value, 'text/turtle', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function serializeStoreToNTriplesPromise(store: $rdf.Store): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, KGI("").value, 'application/n-triples', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { 
                // flags: 'deinprstux', // r: Flag to escape /u unicode characters, t: flag to replace rdf:type by "a", d: flag to use the default namespace for unqualified terms with prefix ":"
                namespaces: store.namespaces 
            });
        } catch (error) {
            reject(error);
        }
    })
}

export function serializeStoreToTriGPromise(store: $rdf.Store): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, KGI("").value, 'application/trig', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function serializeStoreToQuadsPromise(store: $rdf.Store): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, KGI("").value, 'application/nquads', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function parseNTriplesToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "application/n-triples", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseN3ToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "text/n3", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseTurtleToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "text/turtle", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseHTMLToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "text/html", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseJSONLDToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "application/ld+json", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseNQuadsToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "application/nquads", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}

export function parseRDFXMLToStore(content: string, store: $rdf.Store): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, KGI("").value, "application/rdf+xml", (err, kb) => {
                if (err != null) {
                    reject(err);
                }
                accept(kb);
            })
        } catch (error) {
            reject(error);
        }
    });
}