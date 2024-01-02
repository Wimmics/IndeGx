import * as GlobalUtils from "./GlobalUtils.js";
import * as SparqlUtils from "./SPARQLUtils.js";
import * as RDFUtils from "./RDFUtils.js";
import * as Logger from "./LogUtils.js";
import * as $rdf from "rdflib";
import md5 from "md5";
import { generateKey } from "crypto";

const LODCloudRawDataURL = "https://lod-cloud.net/lod-data.json";

type JSONCatalog = {
    [datasetName: string]: {
        _id: string,
        identifier: string,
        title: string,
        doi: string,
        image: string,
        links: LinksObject[],
        triples: string,
        keywords: string[],
        license: string,
        full_download: DownloadObject[],
        example: ExampleObject[],
        sparql: SparqlObject[],
        other_download: DownloadObject[],
        description: {
            [langage: string]: string,
        },
        owner: PersonObject | string,
        website: string,
        domain: string,
        namespace: string,
        contact_point: PersonObject
    }
}

type PersonObject = {
    name: string,
    email: string
}

type LinksObject = {
    target: string,
    value: string,
}

type DownloadObject = {
    media_type: string,
    description: string,
    status: string,
    title: string,
    mirror: string,
    download_url: string,
}

type ExampleObject = {
    title: string,
    media_type: string,
    description: string,
    access_url: string,
    status: string,
}

type SparqlObject = {
    title: string,
    description: string,
    access_url: string,
    status: string,
}

const catalogResource = RDFUtils.KGI("Catalog");
GlobalUtils.fetchJSONPromise(LODCloudRawDataURL).then((json: JSONCatalog) => {
    let datasetNames = Object.keys(json);
    let datasetPromises: Promise<$rdf.Store>[] = [];
    datasetNames.forEach(datasetName => {
        datasetPromises.push(processDataset(datasetName, json[datasetName]));
    });
    Promise.allSettled(datasetPromises).then(result => {
        let finalStore = RDFUtils.createStore();
        finalStore.add(catalogResource, RDFUtils.rdfTypeProperty, RDFUtils.DCAT("Catalog"))
        result.forEach(promiseResult => {
            if (promiseResult.status == "fulfilled") {
                finalStore.addAll(promiseResult.value.statements);
            }
        });
        Logger.log("All datasets processed");
        return RDFUtils.serializeStoreToTurtlePromise(finalStore).then(resultString => {
            return GlobalUtils.writeFile("lod-data.ttl", resultString);

        });
    }).catch(error => {
        Logger.error("Error processing datasets", error);
    });
}).catch(error => {
    Logger.error("Error fetching LOD Cloud data", error);
});

function processDataset(datasetName: string, datasetJSON: JSONCatalog[string]): Promise<$rdf.Store> {
    let resultStore = RDFUtils.createStore();
    return Promise.resolve().then(() => {
        if (datasetJSON != undefined) {
            let datasetIdentifier = datasetJSON.identifier;
            let datasetResource = RDFUtils.KGI(GlobalUtils.unicodeToUrlendcode(datasetIdentifier));
            resultStore.add(datasetResource, RDFUtils.RDF("type"), RDFUtils.VOID("Dataset"));
            resultStore.add(catalogResource, RDFUtils.DCAT("dataset"), datasetResource);

            const identifierTriples = generateDatasetIdentifierTriples(datasetResource, datasetIdentifier);
            resultStore.addAll(identifierTriples);

            let datasetTitle = datasetJSON.title;
            if (datasetTitle != undefined && datasetTitle != null && datasetTitle != "") {
                const titleTriples = generateTitleTriples(datasetResource, datasetTitle);
                resultStore.addAll(titleTriples);
            }

            let datasetDOI = datasetJSON.doi;
            if (datasetDOI != undefined && datasetDOI != null && datasetDOI != "") {
                const doiTriples = generateDatasetDOITriples(datasetResource, datasetDOI);
                resultStore.addAll(doiTriples);
            }

            let datasetImage = datasetJSON.image;
            if (datasetImage != undefined && datasetImage != null && datasetImage != "") {
                const imageTriples = generateDatasetImageTriples(datasetResource, datasetImage);
                resultStore.addAll(imageTriples);
            }

            let linksObjects = datasetJSON.links;
            if (linksObjects != undefined && linksObjects != null && linksObjects.length > 0) {
                const linksTriples = generateDatasetLinksTriples(datasetResource, linksObjects);
                resultStore.addAll(linksTriples);
            }

            let datasetTriples = datasetJSON.triples;
            if (datasetTriples != undefined && datasetTriples != null && Number.parseInt(datasetTriples) > 0) {
                resultStore.add(datasetResource, RDFUtils.VOID("triples"), $rdf.lit(datasetTriples));
            }

            let datasetKeywords = datasetJSON.keywords;
            if (datasetKeywords != undefined && datasetKeywords != null && datasetKeywords.length > 0) {
                const keywordsTriples = generateDatasetKeywordsTriples(datasetResource, datasetKeywords);
                resultStore.addAll(keywordsTriples);
            }

            let datasetLicense = datasetJSON.license;
            if (datasetLicense != undefined && datasetLicense != null && datasetLicense != "") {
                let licenseTriples = generateDatasetLicenseTriples(datasetResource, datasetLicense);
                resultStore.addAll(licenseTriples);
            }

            let datasetFullDownload = datasetJSON.full_download;
            if (datasetFullDownload != undefined && datasetFullDownload != null && datasetFullDownload.length > 0) {
                let distributionTriples = generateDatasetDistributionTriples(datasetResource, datasetFullDownload);
                let fullDownloadTriples = generateDatasetFullDownloadTriples(datasetResource, datasetFullDownload);
                resultStore.addAll(distributionTriples);
                resultStore.addAll(fullDownloadTriples);
            }

            let datasetExample = datasetJSON.example;
            if (datasetExample != undefined && datasetExample != null && datasetExample.length > 0) {
                let exampleTriples = generateDatasetExampleTriples(datasetResource, datasetExample);
                resultStore.addAll(exampleTriples);
            }

            let datasetSPARQL = datasetJSON.sparql;
            if (datasetSPARQL != undefined && datasetSPARQL != null && datasetSPARQL.length > 0) {
                let sparqlTriples = generateDatasetSPARQLTriples(datasetResource, datasetSPARQL);
                resultStore.addAll(sparqlTriples);
            }

            let datasetOtherDownload = datasetJSON.other_download;
            if (datasetOtherDownload != undefined && datasetOtherDownload != null && datasetOtherDownload.length > 0) {
                let distributionTriples = generateDatasetDistributionTriples(datasetResource, datasetOtherDownload);
                resultStore.addAll(distributionTriples);
            }

            let datasetDescription = datasetJSON.description;
            if (datasetDescription != undefined && datasetDescription != null && Object.keys(datasetDescription).length > 0) {
                let descriptionTriples = generateDatasetDescriptionTriples(datasetResource, datasetDescription);
                resultStore.addAll(descriptionTriples);
            }

            let datasetOwner = datasetJSON.owner;
            if (datasetOwner != undefined && datasetOwner != null && datasetOwner != "") {
                let publisherTriples = generatePublisherTriples(datasetResource, datasetOwner);
                resultStore.addAll(publisherTriples);
            }

            let datasetWebsite = datasetJSON.website;
            if (datasetWebsite != undefined && datasetWebsite != null && datasetWebsite != "") {
                let websiteTriples = generateWebsiteTriples(datasetResource, datasetWebsite);
                resultStore.addAll(websiteTriples);
            }

            let datasetDomain = datasetJSON.domain;
            if (datasetDomain != undefined && datasetDomain != null && datasetDomain != "") {
                let domainTriples = generateDomainTriples(datasetResource, datasetDomain);
                resultStore.addAll(domainTriples);
            }

            let namespace = datasetJSON.namespace;
            if (namespace != undefined && namespace != null && namespace != "") {
                let namespaceTriples = generateNamespaceTriples(datasetResource, namespace);
                resultStore.addAll(namespaceTriples);
            }
        }
    }).then(() => {
        Logger.log("Dataset processed", datasetName);
        return resultStore;
    }).catch(error => {
        Logger.error("Error processing dataset", datasetName, error);
        return resultStore;
    }).finally(() => {
        return resultStore;
    })
}

function generateDatasetIdentifierTriples(datasetResource, datasetIdentifier: string): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetIdentifier != undefined && datasetIdentifier != null && datasetIdentifier != "") {
            // dct:identifier
            result.push($rdf.st(datasetResource, RDFUtils.DCT("identifier"), $rdf.lit(datasetIdentifier)));
            // skos:notation
            result.push($rdf.st(datasetResource, RDFUtils.SKOS("notation"), $rdf.lit(datasetIdentifier)));
            // adms:identifier
            result.push($rdf.st(datasetResource, RDFUtils.ADMS("identifier"), $rdf.lit(datasetIdentifier)));
            // schema:identifier 
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("identifier"), $rdf.lit(datasetIdentifier)));
        }
    } catch (error) {
        Logger.error("Error generating identifier triples", error, datasetResource.value, datasetIdentifier);
    }
    return result;
}

function generateTitleTriples(datasetResource, datasetTitle: string): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetTitle != undefined && datasetTitle != null && datasetTitle != "") {
            // dct:title
            result.push($rdf.st(datasetResource, RDFUtils.DCT("title"), $rdf.lit(datasetTitle)));
            // dce:title
            result.push($rdf.st(datasetResource, RDFUtils.DCE("title"), $rdf.lit(datasetTitle)));
            // schema:name
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("name"), $rdf.lit(datasetTitle)));
            // foaf:name
            result.push($rdf.st(datasetResource, RDFUtils.FOAF("name"), $rdf.lit(datasetTitle)));
            // rdfs:label
            result.push($rdf.st(datasetResource, RDFUtils.RDFS("label"), $rdf.lit(datasetTitle)));
            // skos:prefLabel
            result.push($rdf.st(datasetResource, RDFUtils.SKOS("prefLabel"), $rdf.lit(datasetTitle)));
            // cc:attributionName
            result.push($rdf.st(datasetResource, RDFUtils.CC("attributionName"), $rdf.lit(datasetTitle)));
        }
    } catch (error) {
        Logger.error("Error generating title triples", error, datasetResource.value, datasetTitle);
    }
    return result;
}

function generateDatasetDOITriples(datasetResource, datasetDOI: string): $rdf.Statement[] {
    let result = [];

    try {
        if (datasetDOI != undefined && datasetDOI != null && datasetDOI != "") {
            // bibo:doi
            result.push($rdf.st(datasetResource, RDFUtils.BIBO("doi"), $rdf.lit(datasetDOI)));
        }
    } catch (error) {
        Logger.error("Error generating DOI triples", error, datasetResource.value, datasetDOI);
    }
    return result;
}

function generateDatasetImageTriples(datasetResource, datasetImage: string): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetImage != undefined && datasetImage != null && datasetImage != "") {
            // foaf:img
            result.push($rdf.st(datasetResource, RDFUtils.FOAF("img"), $rdf.lit(datasetImage)));
            // schema:image
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("image"), $rdf.lit(datasetImage)));
        }
    } catch (error) {
        Logger.error("Error generating image triples", error, datasetResource.value, datasetImage);
    }
    return result;
}

function generateDatasetLinksTriples(datasetResource, linksObjects: LinksObject[]): $rdf.Statement[] {
    let result = [];
    try {
        if (linksObjects != undefined && linksObjects != null && linksObjects.length > 0) {
            linksObjects.forEach(linkObject => {
                if (linkObject.target != undefined && linkObject.target != null && linkObject.target != "" && linkObject.value != undefined && linkObject.value != null && linkObject.value != "0") {
                    let linkTarget = RDFUtils.KGI(GlobalUtils.unicodeToUrlendcode(linkObject.target));
                    let linkValue = linkObject.value;
                    let linkResource = RDFUtils.KGI(md5(datasetResource.value + linkTarget.value) + "Linkset");
                    // void:target
                    result.push($rdf.st(linkResource, RDFUtils.VOID("target"), linkTarget));
                    // void:target
                    result.push($rdf.st(linkResource, RDFUtils.VOID("target"), datasetResource));
                    // void:triples
                    result.push($rdf.st(linkResource, RDFUtils.VOID("triples"), $rdf.lit(linkValue)));
                    // void:subset
                    result.push($rdf.st(linkResource, RDFUtils.VOID("subset"), datasetResource));
                }
            });
        }
    } catch (error) {
        Logger.error("Error generating links triples", error, datasetResource.value, JSON.stringify(linksObjects));
    }
    return result;
}

function generateDatasetKeywordsTriples(datasetResource, datasetKeywords: string[]): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetKeywords != undefined && datasetKeywords != null && datasetKeywords.length > 0) {
            datasetKeywords.forEach(keyword => {
                if (keyword != undefined && keyword != null && keyword != "") {
                    // schema:keywords
                    result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("keywords"), $rdf.lit(keyword)));
                    // dcat:keyword
                    result.push($rdf.st(datasetResource, RDFUtils.DCAT("keyword"), $rdf.lit(keyword)));
                }
            });
        }
    } catch (error) {
        Logger.error("Error generating keywords triples", error, datasetResource.value, JSON.stringify(datasetKeywords));
    }
    return result;
}

function generateDatasetLicenseTriples(datasetResource, datasetLicense: string): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetLicense != undefined && datasetLicense != null && datasetLicense != "") {
            // schema:license
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("license"), $rdf.lit(datasetLicense)));
            // dct:license
            result.push($rdf.st(datasetResource, RDFUtils.DCT("license"), $rdf.lit(datasetLicense)));
            // doap:license
            result.push($rdf.st(datasetResource, RDFUtils.DOAP("license"), $rdf.lit(datasetLicense)));
            // dbpo:license
            result.push($rdf.st(datasetResource, RDFUtils.DBPO("license"), $rdf.lit(datasetLicense)));
            // cc:license
            result.push($rdf.st(datasetResource, RDFUtils.CC("license"), $rdf.lit(datasetLicense)));
            // xhv:license
            result.push($rdf.st(datasetResource, RDFUtils.XHV("license"), $rdf.lit(datasetLicense)));
            // sto:license
            result.push($rdf.st(datasetResource, RDFUtils.STO("license"), $rdf.lit(datasetLicense)));
            // nie:license
            result.push($rdf.st(datasetResource, RDFUtils.NIE("license"), $rdf.lit(datasetLicense)));
        }
    } catch (error) {
        Logger.error("Error generating license triples", error, datasetResource.value, datasetLicense);
    }
    return result;
}

function generateDatasetDistributionTriples(datasetResource, datasetFullDownload: DownloadObject[]): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetFullDownload != undefined && datasetFullDownload != null && datasetFullDownload.length > 0) {
            datasetFullDownload.forEach(downloadObject => {
                if (downloadObject.download_url != undefined && downloadObject.download_url != null && downloadObject.download_url != "") {
                    let distributionResource = RDFUtils.KGI(md5(datasetResource.value + downloadObject.download_url) + "Distribution");

                    result.push($rdf.st(datasetResource, RDFUtils.DCAT("distribution"), distributionResource));
                    // download_url: string,
                    // dcat:downloadURL
                    result.push($rdf.st(distributionResource, RDFUtils.DCAT("downloadURL"), $rdf.sym(RDFUtils.sanitizeURI(downloadObject.download_url))));
                    // dcat:accessURL
                    result.push($rdf.st(distributionResource, RDFUtils.DCAT("accessURL"), $rdf.sym(RDFUtils.sanitizeURI(downloadObject.download_url))));

                    if (downloadObject.media_type != undefined && downloadObject.media_type != null && downloadObject.media_type != "") {
                        // media_type: string,
                        // dcat:mediaType
                        result.push($rdf.st(distributionResource, RDFUtils.DCAT("mediaType"), $rdf.lit(downloadObject.media_type)));
                    }

                    if (downloadObject.description != undefined && downloadObject.description != null && downloadObject.description != "") {
                        // description: string,
                        result = result.concat(generateDescriptionTriples(distributionResource, downloadObject.description));
                    }

                    if (downloadObject.status != undefined && downloadObject.status != null && downloadObject.status != "") {
                        // status: string,
                        // schema:serverStatus
                        result.push($rdf.st(distributionResource, RDFUtils.SCHEMA("serverStatus"), $rdf.lit(downloadObject.status)));
                    }

                    if (downloadObject.title != undefined && downloadObject.title != null && downloadObject.title != "") {
                        // title: string,
                        result = result.concat(generateTitleTriples(distributionResource, downloadObject.title));
                    }
                }
            });
        }
    } catch (error) {
        Logger.error("Error generating distribution triples", error, datasetResource.value, JSON.stringify(datasetFullDownload));
    }
    return result;
}

function generateDescriptionTriples(resource, description: string, language?: string): $rdf.Statement[] {
    let result = [];
    try {
        if (description != undefined && description != null && description != "") {
            if (language != undefined && language != null && language != "") {
                // dct:description
                result.push($rdf.st(resource, RDFUtils.DCT("description"), $rdf.lit(description, language)));
                // dce:description
                result.push($rdf.st(resource, RDFUtils.DCE("description"), $rdf.lit(description, language)));
                // schema:description
                result.push($rdf.st(resource, RDFUtils.SCHEMA("description"), $rdf.lit(description, language)));
                // owl:comment
                result.push($rdf.st(resource, RDFUtils.OWL("comment"), $rdf.lit(description, language)));
                // rdf:comment
                result.push($rdf.st(resource, RDFUtils.RDF("comment"), $rdf.lit(description, language)));
                // skos:note 
                result.push($rdf.st(resource, RDFUtils.SKOS("note"), $rdf.lit(description, language)));
            } else {
                // dct:description
                result.push($rdf.st(resource, RDFUtils.DCT("description"), $rdf.lit(description)));
                // dce:description
                result.push($rdf.st(resource, RDFUtils.DCE("description"), $rdf.lit(description)));
                // schema:description
                result.push($rdf.st(resource, RDFUtils.SCHEMA("description"), $rdf.lit(description)));
                // owl:comment
                result.push($rdf.st(resource, RDFUtils.OWL("comment"), $rdf.lit(description)));
                // rdf:comment
                result.push($rdf.st(resource, RDFUtils.RDF("comment"), $rdf.lit(description)));
                // skos:note 
                result.push($rdf.st(resource, RDFUtils.SKOS("note"), $rdf.lit(description)));
            }
        }
    } catch (error) {
        Logger.error("Error generating description triples", error, resource.value, description);
    }
    return result;
}

function generateDatasetFullDownloadTriples(datasetResource, datasetFullDownload: DownloadObject[]): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetFullDownload != undefined && datasetFullDownload != null && datasetFullDownload.length > 0) {
            datasetFullDownload.forEach(downloadObject => {
                let distributionResource = RDFUtils.KGI(md5(datasetResource.value + downloadObject.download_url) + "Distribution");
                result.push($rdf.st(datasetResource, RDFUtils.DCAT("distribution"), distributionResource));
                if (downloadObject.download_url != undefined && downloadObject.download_url != null && downloadObject.download_url != "") {
                    // void:dataDump
                    result.push($rdf.st(datasetResource, RDFUtils.VOID("dataDump"), $rdf.sym(RDFUtils.sanitizeURI(downloadObject.download_url))));
                }
            })
        }
    } catch (error) {
        Logger.error("Error generating full download triples", error, datasetResource.value, JSON.stringify(datasetFullDownload));
    }
    return result;
}

function generateDatasetExampleTriples(datasetResource, datasetExample: ExampleObject[]): $rdf.Statement[] {
    let result = [];
    try {
        if (datasetExample != undefined && datasetExample != null && datasetExample.length > 0) {
            datasetExample.forEach(exampleObject => {
                if (exampleObject.access_url != undefined && exampleObject.access_url != null && exampleObject.access_url != "") {
                    // void:exampleResource
                    result.push($rdf.st(datasetResource, RDFUtils.VOID("exampleResource"), $rdf.lit(RDFUtils.sanitizeURI(exampleObject.access_url))));
                    // schema:workExample
                    result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("workExample"), $rdf.lit(RDFUtils.sanitizeURI(exampleObject.access_url))));
                    // skos:example
                    result.push($rdf.st(datasetResource, RDFUtils.SKOS("example"), $rdf.lit(RDFUtils.sanitizeURI(exampleObject.access_url))));
                }
            })
        }
    } catch (error) {
        Logger.error("Error generating example triples", error, datasetResource.value, JSON.stringify(datasetExample));
    }
    return result;
}

function generateDatasetSPARQLTriples(datasetResource, datasetSPARQL: SparqlObject[]): $rdf.Statement[] {
    let result = [];

    try {
        if (datasetSPARQL != undefined && datasetSPARQL != null && datasetSPARQL.length > 0) {
            datasetSPARQL.forEach(sparqlObject => {
                if (sparqlObject.access_url != undefined && sparqlObject.access_url != null && sparqlObject.access_url != "") {
                    // void:sparqlEndpoint
                    result.push($rdf.st(datasetResource, RDFUtils.VOID("sparqlEndpoint"), $rdf.sym(RDFUtils.sanitizeURI(sparqlObject.access_url))));
                    // schema:contentURL
                    result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("contentURL"), $rdf.sym(RDFUtils.sanitizeURI(sparqlObject.access_url))));

                    let serviceResource = RDFUtils.KGI(md5(datasetResource.value + sparqlObject.access_url) + "Service");
                    result.push($rdf.st(datasetResource, RDFUtils.DCAT("service"), serviceResource));
                    result.push($rdf.st(serviceResource, RDFUtils.rdfTypeProperty, RDFUtils.DCAT("DataService")));
                    result.push($rdf.st(serviceResource, RDFUtils.rdfTypeProperty, RDFUtils.SD("Service")));
                    result.push($rdf.st(serviceResource, RDFUtils.DCAT("servesDataset"), datasetResource));
                    // service
                    // dcat:endpointURL
                    result.push($rdf.st(serviceResource, RDFUtils.DCAT("endpointURL"), $rdf.sym(RDFUtils.sanitizeURI(sparqlObject.access_url))));
                    // sd:endpoint
                    result.push($rdf.st(serviceResource, RDFUtils.SD("endpoint"), $rdf.sym(RDFUtils.sanitizeURI(sparqlObject.access_url))));
                }
            })
        }
    } catch (error) {
        Logger.error("Error generating SPARQL triples", error, datasetResource.value, JSON.stringify(datasetSPARQL));
    }

    return result;
}

function generateDatasetDescriptionTriples(datasetResource, descriptionObject: {
    [langage: string]: string,
}): $rdf.Statement[] {
    let result = [];

    try {
        let languages = Object.keys(descriptionObject);
        languages.forEach(language => {
            let description = descriptionObject[language];
            result = result.concat(generateDescriptionTriples(datasetResource, description, language));
        });
    } catch (error) {
        Logger.error("Error generating description triples", error, datasetResource.value, JSON.stringify(descriptionObject));
    }

    return result;
}

function generatePublisherTriples(datasetResource, owner: PersonObject | string): $rdf.Statement[] {
    let result = [];

    try {
        if (owner != undefined && owner != null && owner != "") {
            if (((owner as PersonObject).name != undefined && (owner as PersonObject).name != null && (owner as PersonObject).name != "") || ((owner as PersonObject).email != undefined && (owner as PersonObject).email != null && (owner as PersonObject).email != "")) {
                let concatenatedOwner = (owner as PersonObject).name + (owner as PersonObject).email;
                let ownermd5 = md5(concatenatedOwner);
                let personResource = RDFUtils.KGI(ownermd5 + "Person");
                result.push($rdf.st(personResource, RDFUtils.rdfTypeProperty, RDFUtils.FOAF("Person")));
                result.push($rdf.st(personResource, RDFUtils.rdfTypeProperty, RDFUtils.SCHEMA("Person")));

                // dct:publisher
                result.push($rdf.st(datasetResource, RDFUtils.DCT("publisher"), personResource));
                // dce:publisher
                result.push($rdf.st(datasetResource, RDFUtils.DCE("publisher"), personResource));
                // schema:publisher
                result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("publisher"), personResource));
                // schema:sdPublisher
                result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("sdPublisher"), personResource));
                // pav:providedBy 
                result.push($rdf.st(datasetResource, RDFUtils.PAV("providedBy"), personResource));
                if ((owner as PersonObject).name != undefined && (owner as PersonObject).name != null && (owner as PersonObject).name != "") {
                    result.push($rdf.st(personResource, RDFUtils.FOAF("name"), $rdf.lit((owner as PersonObject).name)));
                    result.push($rdf.st(personResource, RDFUtils.SCHEMA("name"), $rdf.lit((owner as PersonObject).name)));
                }
                if ((owner as PersonObject).email != undefined && (owner as PersonObject).email != null && (owner as PersonObject).email != "") {
                    result.push($rdf.st(personResource, RDFUtils.FOAF("mbox"), $rdf.lit((owner as PersonObject).email)));
                    result.push($rdf.st(personResource, RDFUtils.SCHEMA("email"), $rdf.lit((owner as PersonObject).email)));
                }
            }
        }
    } catch (error) {
        Logger.error("Error generating publisher triples", error, datasetResource.value, owner);
    }

    return result;
}

function generateWebsiteTriples(datasetResource, website: string): $rdf.Statement[] {
    let result = [];

    try {
        if (website != undefined && website != null && website != "") {
            // foaf:homepage
            result.push($rdf.st(datasetResource, RDFUtils.FOAF("homepage"), $rdf.lit(website)));
            // schema:url
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("url"), $rdf.lit(website)));
            // dcat:landingPage
            result.push($rdf.st(datasetResource, RDFUtils.DCAT("landingPage"), $rdf.lit(website)));
        }
    } catch (error) {
        Logger.error("Error generating website triples", error, datasetResource.value, website);
    }

    return result;
}

function generateDomainTriples(datasetResource, domain: string): $rdf.Statement[] {
    let result = [];

    try {
        if (domain != undefined && domain != null && domain != "") {
            // dcat:theme
            result.push($rdf.st(datasetResource, RDFUtils.DCAT("theme"), $rdf.lit(domain)));
            // schema:about
            result.push($rdf.st(datasetResource, RDFUtils.SCHEMA("about"), $rdf.lit(domain)));
            // dct:subject
            result.push($rdf.st(datasetResource, RDFUtils.DCT("subject"), $rdf.lit(domain)));
            // foaf:topic
            result.push($rdf.st(datasetResource, RDFUtils.FOAF("topic"), $rdf.lit(domain)));
            // foaf:primaryTopic
            result.push($rdf.st(datasetResource, RDFUtils.FOAF("primaryTopic"), $rdf.lit(domain)));
            // skos:subject
            result.push($rdf.st(datasetResource, RDFUtils.SKOS("subject"), $rdf.lit(domain)));
        }
    } catch (error) {
        Logger.error("Error generating domain triples", error, datasetResource.value, domain);
    }

    return result;
}

function generateNamespaceTriples(datasetResource, namespace: string): $rdf.Statement[] {
    let result = [];

    try {
        if (namespace != undefined && namespace != null && namespace != "") {
            // void:uriSpace
            result.push($rdf.st(datasetResource, RDFUtils.VOID("uriSpace"), $rdf.lit(namespace)));
        }
    } catch (error) {
        Logger.error("Error generating namespace triples", error, datasetResource.value, namespace);
    }

    return result;
}