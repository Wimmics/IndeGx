import * as $rdf from "rdflib";
import * as Global from "./GlobalUtils.js";
import * as Logger from "./LogUtils.js"
import ttl_read from "@graphy/content.ttl.read";
import nt_read from "@graphy/content.nt.read";
import nq_read from "@graphy/content.nq.read";
import trig_read from "@graphy/content.trig.read";
import {resolve } from "url";

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

export function urlToBaseURI(url: string) {
    let baseURI = url.replace(new RegExp("/^(?:.*\/)*([^\/\r\n]+?|)(?=(?:\.[^\/\r\n.\.]*\.)?$)/gm"), "");
    baseURI = baseURI.substring(0, baseURI.lastIndexOf("/")+1);
    return baseURI;
}

export function urlIsAbsolute(url: string) {
    var regex = new RegExp('^(?:[a-z+]+:)?//', 'i');
    return regex.test(url);
}

export function sanitizeUrl(url: string, baseURI: string, filename?: string): string {
    let result = url;
    if(url.localeCompare("") == 0) {
        result = filename;
    }
    if(! urlIsAbsolute(result)) { 
        if(filename != null && filename != undefined && filename != "") {
            result = resolve(filename, result);
        } else {
            result = resolve(baseURI, result);
        }
    }
    if (!(result.startsWith("http://") || result.startsWith("https://") || result.startsWith("file://"))) {
        result = "file://" + result;
    }

    return result;
}

export function fixCommonTurtleStringErrors(ttlString: string): string {
    if(ttlString == null || ttlString == undefined) {
        throw new Error("Invalid turtle string " + ttlString);
    } else {
        const betterRegexNodeB = /([\s|\n]+)((node|b)[^:\s]+)(\s)+/g;
        const betterRegexNodeBReplacement = "$1_:$2$4"
        const regexURIWithoutBracketsRegex = /(\s)(([a-zA-Z0-9-]+:\/\/(([a-zA-Z0-9-]+\.)?[a-zA-Z0-9-]+)+(\.[a-zA-Z0-9\-_:]+)\/)([a-zA-Z0-9\-_:])*)(\s+)/g
        const regexURIWithoutBracketsReplacement = "$1<$2>$8"
        const prefixedURIwithSlashesRegex = /([\s|\n]+)(([a-zA-Z0-9]+:)((\/[a-zA-Z0-9]*)+)+)([\s|\n]+)/g
        const prefixedURIwithSlashesRegexReplacement = "$1$3$6"
        let result = ttlString;
        result = result.replaceAll("nodeID://", "_:"); // Dirty hack to fix nodeID:// from Virtuoso servers for turtle
        result = result.replaceAll("genid-", "_:"); // Dirty hack to fix blank nodes with genid- prefix
        result = result.replaceAll(betterRegexNodeB, betterRegexNodeBReplacement); // Dirty hack to fix blank nodes with b or node prefix and without ":"
        result = result.replaceAll(regexURIWithoutBracketsRegex, regexURIWithoutBracketsReplacement); // Dirty hack ot remove property URIs that appear in Turtle returned by Corese when they have two ":". Should be fixed in Corese >4.4.1
        result = result.replaceAll(prefixedURIwithSlashesRegex, prefixedURIwithSlashesRegexReplacement) // Very dirty hack: Edit malformed prefixed URIs that contain slashes by removing everything after the first slash
        result = Global.replaceUnicode(result);
        return result;
    }
}

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

function getGraphyReadingFunction(contentType: FileContentType) {
    switch (contentType) {
        case NQuadsContentType:
            return nq_read;
        case NTriplesContentType:
            return nt_read;
        case TrigContentType:
            return trig_read;
        default:
        case TurtleContentType:
            return ttl_read;
    }
}

function graphyQuadLoadingToStore(store: $rdf.Store, y_quad: any, baseURI, filename = KGI("").value) {
    function createValidBlankNode(node, baseURI) {
        if (node.termType === "BlankNode") {
            return $rdf.sym(baseURI + "#" + node.value);
        } else {
            throw new Error("Invalid node" + node + " expecting blank node");
        }
    }

    try {
        let s = undefined;
        if (y_quad.subject.termType === "NamedNode") {
                s = $rdf.sym(sanitizeUrl(y_quad.subject.value, baseURI, filename));
        } else if (y_quad.subject.termType === "Literal") {
            if (y_quad.subject.language != null && y_quad.subject.language != undefined && y_quad.subject.language != "") {
                s = $rdf.lit(y_quad.subject.value, y_quad.subject.language)
            } else if (y_quad.subject.datatype != null && y_quad.subject.datatype != undefined && y_quad.subject.datatype != "") {
                s = $rdf.lit(y_quad.subject.value, undefined, $rdf.sym(y_quad.subject.datatype))
            } else {
                s = $rdf.lit(y_quad.subject.value)
            }
        } else {
            s = createValidBlankNode(y_quad.subject, baseURI);
        };
        const p = $rdf.sym(y_quad.predicate.value);
        let o = undefined;
        if (y_quad.object.termType === "NamedNode") {
            o = $rdf.sym(sanitizeUrl(y_quad.object.value, baseURI, filename));
        } else if (y_quad.object.termType === "Literal") {
            if (y_quad.object.language != null && y_quad.object.language != undefined && y_quad.object.language != "") {
                o = $rdf.lit(y_quad.object.value, y_quad.object.language)
            } else if (y_quad.object.datatype != null && y_quad.object.datatype != undefined && y_quad.object.datatype != "") {
                o = $rdf.lit(y_quad.object.value, undefined, $rdf.sym(y_quad.object.datatype))
            } else {
                o = $rdf.lit(y_quad.object.value)
            }
        } else {
            o = createValidBlankNode(y_quad.object, baseURI);
        };

        if (!$rdf.isLiteral(s)) { // The application of RDF reasoning makes appear Literals as subjects, for some reason. We filter them out.
            if (y_quad.graph.value === '') {
                store.add(s, p, o);
            } else {
                const g = $rdf.sym(y_quad.graph);
                store.add(s, p, o, g);
            }
        }
    } catch (error) {
        Logger.error("Error while loading quad", y_quad, "error", error);
    }
}

export function loadRDFFile(file: string, store: $rdf.Store, baseURI?: string): Promise<void> {
    return loadRDFFiles([file], store, baseURI);
}

export function loadRDFFiles(files: Array<string>, store: $rdf.Store, generalBaseUri?: string): Promise<void> {
    try {
        const promiseArray = files.map(filename => {
            let baseURI = urlToBaseURI(filename);
            if (generalBaseUri != null && generalBaseUri != undefined) {
                baseURI = generalBaseUri;
            }
            const contentType = guessContentType(filename);
            let readingFunction = ttl_read;
            if (contentType != undefined) {
                readingFunction = getGraphyReadingFunction(contentType)
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
                    Global.readFile(filename).then(content => {
                        readingFunction(content, {
                            data(y_quad) {
                                graphyQuadLoadingToStore(store, y_quad, baseURI, filename)
                            },

                            eof(h_prefixes) {
                                resolve();
                            },
                            error(error) {
                                Logger.error("Error while reading RDF file", filename, " using graphy reading function, error", error);
                                reject(error)
                            }
                        });
                    }).catch(error => {
                        Logger.error("Error while reading RDF file", filename, "error", error);
                        reject(error)
                    })
                } catch (error) {
                    Logger.error("Error while loading RDF files", files, "error", error);
                    reject(error)
                }
            }).catch(error => {
                Logger.error("Error while loading RDF files", files, "error", error);
                return Promise.reject(error);
            })
        });
        return Promise.allSettled(promiseArray).then(results => Promise.resolve());
    } catch (error) {
        Logger.error("Error while loading RDF files", files, "error", error);
        return Promise.reject(error);
    }
}

export function serializeStoreToTurtlePromise(store: $rdf.Store, baseURI?: string): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, baseURI, 'text/turtle', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                // str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function serializeStoreToNTriplesPromise(store: $rdf.Store, baseURI?: string): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, baseURI, 'application/n-triples', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                // str = Global.unicodeToUrlendcode(str)
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

export function serializeStoreToTriGPromise(store: $rdf.Store, baseURI?: string): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, baseURI, 'application/trig', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                // str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function serializeStoreToQuadsPromise(store: $rdf.Store, baseURI?: string): Promise<string> {
    return new Promise((accept, reject) => {
        try {
            $rdf.serialize(null, store, baseURI, 'application/nquads', function (err, str) {
                if (err != null) {
                    reject(err);
                }
                // str = Global.unicodeToUrlendcode(str)
                accept(str)
            }, { namespaces: store.namespaces });
        } catch (error) {
            reject(error);
        }
    })
}

export function parseNTriplesToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            // content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, baseURI, "application/n-triples", (err, kb) => {
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

export function parseN3ToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            // content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, baseURI, "text/n3", (err, kb) => {
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

export function parseTurtleToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Store> {
    return new Promise((accept, reject) => {
        try {
            content = fixCommonTurtleStringErrors(content)
            ttl_read(content, {
                relax: true,
                baseIRI: baseURI,
                data(y_quad) {
                    graphyQuadLoadingToStore(store, y_quad, baseURI, "")
                },
                
                eof(h_prefixes) {
                    accept(store);
                },
                error(error) {
                    Logger.error("Error while reading RDF Turtle content using graphy reading function, error", error);
                    reject(error)
                }
            });
        } catch (error) {
            Logger.error("Error while parsing turtle content", content, "error", error);
            reject(error);
        }
    });
}

export function parseHTMLToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            $rdf.parse(content, store, baseURI, "text/html", (err, kb) => {
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

export function parseJSONLDToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            // content = Global.unicodeToUrlendcode(content)
            $rdf.parse(content, store, baseURI, "application/ld+json", (err, kb) => {
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

export function parseNQuadsToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            $rdf.parse(content, store, baseURI, "application/nquads", (err, kb) => {
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

export function parseRDFXMLToStore(content: string, store: $rdf.Store, baseURI: string): Promise<$rdf.Formula> {
    return new Promise((accept, reject) => {
        try {
            $rdf.parse(content, store, baseURI, "application/rdf+xml", (err, kb) => {
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

/**
    Converts an RDF collection represented by the given named node, blank node, or variable into an array of nodes.
    @param {$rdf.NamedNode | $rdf.BlankNode | $rdf.Variable} collection - The node representing the collection to convert.
    @param {$rdf.Store} store - The RDF store containing the collection.
    @returns {$rdf.Node[]} An array of nodes representing the collection.
    */
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