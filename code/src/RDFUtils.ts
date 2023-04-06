import * as $rdf from "rdflib";
import * as fs from "fs";
import { urlToBaseURI } from "./GlobalUtils.js";
import * as Global from "./GlobalUtils.js";
import * as Logger from "./LogUtils.js"
import ttl_read from "@graphy/content.ttl.read";
import nt_read from "@graphy/content.nt.read";
import nq_read from "@graphy/content.nq.read";
import trig_read from "@graphy/content.trig.read";

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
    store.setPrefixForURI("cc", "http://creativecommons.org/ns#");
    store.setPrefixForURI("culturefr", "https://www.culture.gouv.fr/");
    store.setPrefixForURI("dbfr", "http://fr.dbpedia.org/");
    store.setPrefixForURI("dbfrg", "http://fr.dbpedia.org/graph/");
    store.setPrefixForURI("dbfrp", "http://fr.dbpedia.org/property/");
    store.setPrefixForURI("dbo", "http://dbpedia.org/ontology/");
    store.setPrefixForURI("dbspr", "http://dbpedia.org/schema/property_rules#");
    store.setPrefixForURI("dcat", "http://www.w3.org/ns/dcat#");
    store.setPrefixForURI("dce", "http://purl.org/dc/elements/1.1/");
    store.setPrefixForURI("dcmitype", "http://purl.org/dc/dcmitype/");
    store.setPrefixForURI("eclass", "http://www.ebusiness-unibw.org/ontologies/eclass/5.1.4/#");
    store.setPrefixForURI("ex", "https://e.g/#");
    store.setPrefixForURI("georss", "http://www.georss.org/georss/");
    store.setPrefixForURI("goodrel", "http://purl.org/goodrelations/v1#");
    store.setPrefixForURI("inria", "https://www.inria.fr/");
    store.setPrefixForURI("kgi", "http://ns.inria.fr/kg/index#");
    store.setPrefixForURI("localdav", "http://localhost:8890/DAV/");
    store.setPrefixForURI("mod", "https://w3id.org/mod#");
    store.setPrefixForURI("oa", "http://www.w3.org/ns/oa#");
    store.setPrefixForURI("openvoc", "http://open.vocab.org/terms/");
    store.setPrefixForURI("pav", "http://purl.org/pav/");
    store.setPrefixForURI("powders", "http://www.w3.org/2007/05/powder-s#");
    store.setPrefixForURI("schema", "http://schema.org/");
    store.setPrefixForURI("sd", "http://www.w3.org/ns/sparql-service-description#");
    store.setPrefixForURI("skos", "http://www.w3.org/2004/02/skos/core#");
    store.setPrefixForURI("vann", "http://purl.org/vocab/vann/");
    store.setPrefixForURI("voaf", "http://purl.org/vocommons/voaf#");
    store.setPrefixForURI("wdentity", "http://www.wikidata.org/entity/");
    store.setPrefixForURI("wimmics", "https://team.inria.fr/wimmics/");
    return store;
}

export function loadRDFFile(file: string, store: $rdf.Store, baseURI?: string): Promise<any> {
    return loadRDFFiles([file], store, baseURI);
}

export function loadRDFFiles(files: Array<string>, store: $rdf.Store, generalBaseUri?: string): Promise<any> {
    try {
        const promiseArray = files.map(filename => {
            let baseURI = urlToBaseURI(filename);
            if (generalBaseUri != null && generalBaseUri != undefined) {
                baseURI = generalBaseUri;
            }
            const contentType = guessContentType(filename);
            let readingFunction = ttl_read;
            if (contentType != undefined) {
                switch (contentType) {
                    case NQuadsContentType:
                        readingFunction = nq_read;
                        break;
                    case NTriplesContentType:
                        readingFunction = nt_read;
                        break;
                    case TrigContentType:
                        readingFunction = trig_read;
                        break;
                    default:
                    case TurtleContentType:
                        readingFunction = ttl_read;
                        break;
                }
            } else {
                throw new Error("Unsupported content type for " + filename + ", only .ttl, .nq and .nt supported.");
            }

            return new Promise<void>((resolve, reject) => {
                try {
                    if (filename.startsWith("http")) {
                        filename = filename.replace("http://", "https://");
                    } else if (filename.startsWith("file")) {
                        filename = filename.replace("file://", "");
                    }
                    fs.createReadStream(filename)
                        .pipe(readingFunction({ baseURI: baseURI }))
                        .on('data', (y_quad) => {
                            const s = y_quad.subject.termType === "NamedNode" ? $rdf.sym(y_quad.subject.value) : (y_quad.subject.termType === "Literal" ? $rdf.lit(y_quad.subject.value, y_quad.subject.language, y_quad.subject.datatype) : $rdf.sym(baseURI + "#" + y_quad.subject.value));
                            const p = $rdf.sym(y_quad.predicate.value);
                            const o = y_quad.object.termType === "NamedNode" ? $rdf.sym(y_quad.object.value) : (y_quad.object.termType === "Literal" ? $rdf.lit(y_quad.object.value, y_quad.object.language, y_quad.object.datatype) : $rdf.sym(baseURI + "#" + y_quad.object.value));

                            if(! $rdf.isLiteral(s)) { // The application of RDF reasoning make appear Literals as subjects, for some reason. We filter them out.
                                if (y_quad.graph.value === '') {
                                    store.add(s, p, o);
                                } else {
                                    const g = $rdf.sym(y_quad.graph);
                                    store.add(s, p, o, g);
                                }
                            }
                        })
                        .on('eof', prefixes => {
                            resolve();
                        })
                        .on('error', (error) => {
                            Logger.error("Error while reading RDF files", files, "error", error);
                            reject(error)
                        });
                } catch (error) {
                    Logger.error("Error while loading RDF files", files, "error", error);
                    reject(error)
                }
            })
        });
        return Promise.allSettled(promiseArray).then(() => {
            Logger.log(files, "read", store.length, "triples");
        });
    } catch (error) {
        Logger.error("Error while loading RDF files", files, "error", error);
        return Promise.reject(error);
    }
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

export function parseTurtleToStore(content: string, store: $rdf.Store, base = KGI("").value): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, base, "text/turtle", (err, kb) => {
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

export function queryRDFLibStore(store: $rdf.Store, query: string) {
    return new Promise((resolve, reject) => {
        try {
            let parsedQuery = $rdf.SPARQLToQuery(query, false, store);
            if (parsedQuery as $rdf.Query) {
                parsedQuery = parsedQuery as $rdf.Query;
                store.query(parsedQuery, results => {
                    resolve(results);
                });
            } else {
                reject("Query is not a valid SPARQL query" + query);
            }
        } catch (error) {
            reject(error);
        }
    });
}

export function collectionToArray(collection: $rdf.NamedNode | $rdf.BlankNode | $rdf.Variable, store: $rdf.Store): $rdf.Node[] {
    let result = [];

    store.statementsMatching(collection, RDF("first")).forEach(statement => {
        if (!statement.object.equals(RDF("nil"))) {
            result.push(statement.object);
        }
    });

    store.statementsMatching(collection, RDF("rest")).forEach(statement => {
        if (!statement.object.equals(RDF("nil"))) {
            if ($rdf.isNamedNode(statement.object)) {
                result = result.concat(collectionToArray(statement.object as $rdf.NamedNode, store));
            } else if ($rdf.isBlankNode(statement.object)) {
                result = result.concat(collectionToArray(statement.object as $rdf.BlankNode, store));
            }
        }
    });

    return [...new Set(result)];
}

export const NTriplesContentType = "application/n-triples" as const
export const NQuadsContentType = "application/nquads" as const
export const TurtleContentType = "text/turtle" as const
export const TrigContentType = "application/trig" as const

export type FileContentType = typeof TurtleContentType | typeof NTriplesContentType | typeof NQuadsContentType | typeof TrigContentType;

export function guessContentType(filename: string): FileContentType | undefined {
    filename = filename.trim();
    if (filename.endsWith(".ttl")) {
        return TurtleContentType;
    } else if (filename.endsWith(".nt")) {
        return NTriplesContentType;
    } else if (filename.endsWith(".nq")) {
        return NQuadsContentType;
    } else if (filename.endsWith(".trig")) {
        return TrigContentType;
    } else {
        return undefined;
    }
}