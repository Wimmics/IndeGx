
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import * as Logger from "./LogUtils.js"
import * as Global from "./GlobalUtils.js"

import * as csv from 'csv-parse/sync';
import { ADMS, CC, DATAID, DCAT, DCE, DCMITYPE, DCT, DOAP, DQV, FOAF, NIE, OWL, PAV, PROV, RDFS, SCHEMA, SD, SKOS, STO, VOID, XHV } from './RDFUtils.js';

const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
]

type Option = {
    help?: boolean,
    endpoint?: string,
}

const options: Option = commandLineArgs(optionDefinitions)
if (options.help) {
    const sections = [
        {
            header: 'Watdiv configuration generation from indexed data',
            content: 'Generates a Watdiv configuration file from an indexed data file.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'help',
                    alias: 'h',
                    type: Boolean,
                    description: 'Print this usage guide.'
                },
            ]
        },
        {
            content: 'Project home: {underline https://github.com/Wimmics/IndeGx}'
        }
    ]
    const usage = commandLineUsage(sections)
    console.info(usage)
    process.exit()
}

type EntityDeclarationData = {
    class: string,
    min: number,
    max: number,
    average: number,
    nbDataset: number,
}

type NonLiteralPropertyData = {
    class: string,
    property: string,
    objectClass: string,
    min: number,
    max: number,
    average: number,
    nbDataset: number,
}

type LiteralPropertyData = {
    class: string,
    property: string,
    objectDatatype: string,
    min: number,
    max: number,
    average: number,
    minValue: number,
    maxValue: number,
    nbDataset: number,
}

let classCardinality: Map<string, number> = new Map();
let namespacePrefixMap: Map<string, string> = new Map();
const totalNumberOfDataset = 2429;

const excludedClasses = [
    OWL('Class').value, 
    RDFS("Class").value
]

const datasetClasses = [
    DCAT("Dataset").value,
    VOID("Dataset").value,
    DCMITYPE("Dataset").value,
    SCHEMA("Dataset").value,
    SD("Dataset").value,
    DATAID("Dataset").value
]

const accessStatementProperties = [
    DCE('rights').value,
    DCT('rights').value,
    DCT('accessRights').value
]

const exampleProperties =[
    SCHEMA("workExample").value,
    VOID("exampleResource").value,
    SKOS("example").value
]

const qualityAnnotationProperties = [
    SCHEMA("review").value,
    DQV("hasQualityAnnotation").value
]

const alternativeLabelProperties = [
    SCHEMA("alternateName").value,
    DCT("alternative").value,
    SKOS("altLabel").value
]

const identifierProperties = [
    SCHEMA("identifier").value,
    DCE("identifier").value,
    DCT("identifier").value,
    ADMS("identifier").value
]

const serializationProperties = [
    DCE("format").value,
    DCT("format").value,
    SCHEMA("encodingFormat").value,
    VOID("feature").value
]

const audienceProperties = [
    DCT("audience").value,
    SCHEMA("audience").value,
    DATAID("usefulness").value
]

const sourceProperties = [
    DCE("source").value,
    DCT("source").value,
    SCHEMA("isBasedOn").value,
    PAV("derivedFrom").value,
    PAV("importedFrom").value,
    PAV("retrievedFrom").value,
    PROV("wasDerivedFrom").value,
    PROV("hadPrimarySource").value
]

const creationDateProperties = [
    DCT("created").value,
    SCHEMA("dateCreated").value,
    PAV("createdOn").value,
    PROV("generatedAtTime").value
]

const keywordsProperties = [
    SCHEMA("keywords").value,
    DCAT("keyword").value
]

const endpointURLProperties = [
    SCHEMA("contentURL").value,
    VOID("sparqlEndpoint").value
]

const creationLocationProperties = [
    SCHEMA("locationCreated").value,
    PAV("createdAt").value
]

const languageProperties = [ 
    SCHEMA("inLanguage").value,
    DCT("language").value
]

const spatialCoverageProperties = [
    SCHEMA("patialCoverage").value,
    DCT("spatial").value
]

const creationMethodProperties = [
    PAV("createdWith").value,
    PAV("retrievedBy").value,
    PAV("importedBy").value
]

const licenseProperties = [
    DCT("license").value,
    SCHEMA("license").value,
    SCHEMA("sdLicense").value,
    DOAP("license").value,
    CC("license").value,
    XHV("license").value,
    STO("license").value,
    NIE("license").value
]

const temporalCoverageProperties = [
    SCHEMA("temporalCoverage").value,
    DCT("temporal").value
]

const creatorProperties = [
    DCE("creator").value,
    DCT("creator").value,
    FOAF("maker").value,
    SCHEMA("creator").value,
    PAV("createdBy").value,
    SCHEMA("author").value,
    PAV("authoredBy").value
]

const titleProperties = [
    SCHEMA("name").value,
    DCE("title").value,
    DCT("title").value,
    RDFS("label").value
]

const descriptionProperties = [
    RDFS("comment").value,
    DCE("description").value,
    DCT("description").value,
    SCHEMA("description").value,
    DATAID("dataDescription").value,
    OWL("comment").value,
    SKOS("note").value
]

const modificationDateProperties = [
    DCT("modified").value,
    SCHEMA("dateModified").value,
    PAV("lastUpdateOn").value,
    PAV("contributedOn").value
]

const topicProperties = [
    DCE("subject").value,
    DCT("subject").value,
    FOAF("topic").value,
    FOAF("primaryTopic").value,
    SCHEMA("about").value,
    DCAT("theme").value
]

const distributionProperties = [
    SCHEMA("distribution").value,
    DCAT("distribution").value
]

const otherPagesProperties = [
    SCHEMA("relatedLink").value,
    RDFS("seeAlso").value
]

const versionNotesProperties = [
    ADMS("versionNotes").value,
    OWL("versionInfo").value
]

const otherVersionProperties = [
    DCT("isVersionOf").value,
    PAV("previousVersion").value,
    OWL("priorVersion").value
]

const versionProperties = [
    SCHEMA("version").value,
    DCT("hasVersion").value,
    DCAT("version").value,
    PAV("version").value,
    PAV("hasCurrentVersion").value
]

const editorProperties = [
    DCE("contributor").value,
    DCT("contributor").value,
    SCHEMA("contributor").value,
    PAV("contributedBy").value,
    SCHEMA("editor").value
]

const contributorProperties = [
    DCE("contributor").value,
    DCT("contributor").value,
    SCHEMA("contributor").value,
    PAV("contributedBy").value,
    SCHEMA("editor").value
]

const publicationDateProperties = [
    DCT("issued").value,
    DCT("available").value,
    SCHEMA("datePublished").value,
    SCHEMA("sdDatePublished").value
]

const vocabulariesProperties = [
    DCT("conformsTo").value,
    VOID("vocabulary").value
]

const endAvailabilityProperties = [
    SCHEMA("expires").value,
    PROV("invalidatedAtTime").value
]

const publicationReferencesProperties = [
    SCHEMA("publication").value,
    DCT("references").value
]

const webpageProperties = [
    FOAF("homepage").value,
    SCHEMA("url").value,
    DCAT("landingPage").value
]

const endValidityProperties = [
    DCT("valid").value,
    SCHEMA("expires").value
]

const publisherProperties = [
    DCE("publisher").value,
    DCT("publisher").value,
    SCHEMA("publisher").value,
    SCHEMA("sdPublisher").value,
    PAV("providedBy").value
]

let datasetMinOccurences = new Map<string, number>()
let datasetMaxOccurences = new Map<string, number>()
let datasetAverageOccurences = new Map<string, number>()

Global.readFile("class_instances_MinMaxAverageOccurences_NbDataset.csv").then(data => {
    const csvData = csv.parse(data, { columns: true, delimiter: ',' });
    let entityDataset: EntityDeclarationData[] = csvData.map((row: any) => {
        return {
            class: uriToPrefixedUri(row.c),
            min: parseInt(row.minCount),
            max: parseInt(row.maxCount),
            average: parseFloat(row.avgCount),
            nbDataset: parseInt(row.countDataset),
        }
    })

    entityDataset = entityDataset.filter((row: any) => {
        return row.nbDataset > 1;
    })

    entityDataset = entityDataset.sort((a: any, b: any) => {
        if (a.nbDataset > b.nbDataset) {
            return -1;
        }
        if (a.nbDataset < b.nbDataset) {
            return 1;
        }
        return 0;
    })

    entityDataset.forEach((row: EntityDeclarationData) => {
        classCardinality.set(row.class, row.average);
    })

    return Global.readFile("class_property_object-class_MinMaxAverage_NbDatasets.csv").then(cpocData => {
        const csvData = csv.parse(cpocData, { columns: true, delimiter: ',' });
        let nonLiteralPropertyDataset: NonLiteralPropertyData[] = csvData.map((row: any) => {
            return {
                class: uriToPrefixedUri(row.c),
                property: uriToPrefixedUri(row.p),
                objectClass: uriToPrefixedUri(row.oc),
                min: parseInt(row.minAllC),
                max: parseInt(row.maxAllC),
                average: parseFloat(row.averageAll),
                nbDataset: parseInt(row.countAllDataset),
            }
        })

        nonLiteralPropertyDataset = nonLiteralPropertyDataset.sort((a: any, b: any) => {
            if (a.nbDataset > b.nbDataset) {
                return -1;
            }
            if (a.nbDataset < b.nbDataset) {
                return 1;
            }
            return 0;
        })

        Logger.log(JSON.stringify(classCardinality));

        const watdivNonLiteralProperties = classPropertyObjectClassToWatdivNonLiteralProperties(nonLiteralPropertyDataset, classCardinality);

        return Global.readFile("class_property_object-datatype_MinMaxAverageOccurrences_MinMaxValues_NbDatasets.csv").then(cpodData => {
            const csvData = csv.parse(cpodData, { columns: true, delimiter: ',' });
            let literalPropertyDataset: LiteralPropertyData[] = csvData.map((row: any) => {
                return {
                    class: uriToPrefixedUri(row.c),
                    property: uriToPrefixedUri(row.p),
                    objectDatatype: row.od,
                    min: parseInt(row.minAllC),
                    max: parseInt(row.maxAllC),
                    average: parseFloat(row.averageAll),
                    minValue: parseFloat(row.minValueAll),
                    maxValue: parseFloat(row.maxValueAll),
                    nbDataset: parseInt(row.countAllDataset),
                }
            })

            literalPropertyDataset = literalPropertyDataset.sort((a: any, b: any) => {
                if (a.nbDataset > b.nbDataset) {
                    return -1;
                }
                if (a.nbDataset < b.nbDataset) {
                    return 1;
                }
                return 0;
            })

            const watdivEntities = classInstancesToWatdivEntityDeclaration(entityDataset, literalPropertyDataset, classCardinality);

            return Global.writeFile("watdiv_config.txt", namespacesToWatdivPrefixes() + watdivEntities + watdivNonLiteralProperties)
        })

    })

})

function classInstancesToWatdivEntityDeclaration(entityDataset: EntityDeclarationData[], literalPropertyDataset: LiteralPropertyData[], classCardinality: Map<string, number>) {
    let watdiv = "";
    entityDataset.forEach((row: EntityDeclarationData) => {
        const classLiteralPropertiesDeclarations = classPropertyObjectDatatypeToWatdivLiteralProperties(row.class, literalPropertyDataset, classCardinality);
        if(! excludedClasses.includes(row.class)) {
            watdiv += `<type*> ${row.class} ${row.min}\n${classLiteralPropertiesDeclarations}</type>\n`;
        }
    })
    return watdiv;
}

function classPropertyObjectClassToWatdivNonLiteralProperties(dataset: NonLiteralPropertyData[], classCardinality: Map<string, number>) {
    let watdiv = "";
    dataset.forEach((row: NonLiteralPropertyData) => {
        const subjectCardinality = classCardinality.get(row.class);
        const objectCardinality = classCardinality.get(row.objectClass);
        if (subjectCardinality !== undefined && objectCardinality !== undefined && ! excludedClasses.includes(row.class)) {
            watdiv += `#association ${row.class} ${row.property} ${row.objectClass} ${subjectCardinality} ${row.min}[uniform] ${row.nbDataset / totalNumberOfDataset}\n`;
        }
    })
    return watdiv;
}

function classPropertyObjectDatatypeToWatdivLiteralProperties(className: string, dataset: LiteralPropertyData[], classCardinality: Map<string, number>) {
    let watdiv = "";
    let filteredDataset = dataset.filter((row: LiteralPropertyData) => { return row.class === className });
    filteredDataset.forEach((row: LiteralPropertyData) => {
        const subjectCardinality = classCardinality.get(row.class);
        if (subjectCardinality !== undefined) {
            const literalType = datatypeToWatdivLiteralType(row.objectDatatype);
            watdiv += `<pgroup> ${row.nbDataset / totalNumberOfDataset}\n#predicate ${row.property} ${literalType}\n</pgroup>\n`;
        }
    })
    return watdiv;
}

function namespacesToWatdivPrefixes() {
    let watdiv = "";
    for (const [namespace, prefix] of namespacePrefixMap.entries()) {
        if(namespace !== undefined && prefix !== undefined) {
            watdiv += `#namespace\t${prefix}=${namespace}\n`;
        }
    }
    return watdiv;
}

function datatypeToWatdivLiteralType(datatype: string) {
    // INTEGER | integer | STRING | string | DATE | date | NAME | name
    switch (datatype) {
        case "http://www.w3.org/2001/XMLSchema#string":
            return "string";
        case "http://www.w3.org/2001/XMLSchema#int":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#integer":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#float":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#double":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#boolean":
            return "name";
        case "http://www.w3.org/2001/XMLSchema#date":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#dateTime":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#time":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#gYear":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#gYearMonth":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#gMonth":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#gMonthDay":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#gDay":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#duration":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#yearMonthDuration":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#dayTimeDuration":
            return "date";
        case "http://www.w3.org/2001/XMLSchema#byte":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#short":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#long":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#decimal":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#unsignedByte":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#unsignedInt":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#unsignedLong":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#positiveInteger":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#nonNegativeInteger":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#nonPositiveInteger":
            return "integer";
        case "http://www.w3.org/2001/XMLSchema#negativeInteger":
            return "integer";
        default:
            return "string";
    }
}

function namespaceToPrefix(namespace: string) {
    if (namespacePrefixMap.has(namespace)) {
        return namespacePrefixMap.get(namespace);
    }
    const prefix = `ns${namespacePrefixMap.size}`;
    namespacePrefixMap.set(namespace, prefix);
    return prefix;
}

function prefixToNamespace(prefix: string) {
    for (const [key, value] of namespacePrefixMap.entries()) {
        if (value === prefix) {
            return key;
        }
    }
    return null;
}

function extractNamepaceFromUri(uri: string) {
    let result = "FAILED";

    const regex = /(([a-zA-Z0-9-]+:\/\/)(([a-zA-Z0-9\-_]+\.)*[a-zA-Z0-9\-_]*(\/[a-zA-Z0-9\-\._:]+)*)[#\/])([a-zA-Z0-9\-_:\=]+)([a-zA-Z0-9\-_:\?\=]+)*/g;
    const match = regex.exec(uri);

    if (match) {
        return match[1]; // Le namespace de l'URI se trouve dans le groupe 1
    }
}

function uriToPrefixedUri(uri: string) {
    const namespace = extractNamepaceFromUri(uri);
    const prefix = namespaceToPrefix(namespace);
    if(namespace !== undefined && prefix !== undefined) {
        return uri.replace(namespace, prefix + ":");
    } else {
        return uri;
    }
}