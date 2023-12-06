import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import * as Logger from "./LogUtils.js";
import * as Global from "./GlobalUtils.js";
import * as csv from 'csv-parse/sync';
const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
];
const options = commandLineArgs(optionDefinitions);
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
    ];
    const usage = commandLineUsage(sections);
    console.info(usage);
    process.exit();
}
let classCardinality = new Map();
let namespacePrefixMap = new Map();
const totalNumberOfDataset = 2429;
Global.readFile("class_instances_MinMaxAverageOccurences_NbDataset.csv").then(data => {
    const csvData = csv.parse(data, { columns: true, delimiter: ',' });
    let entityDataset = csvData.map((row) => {
        return {
            class: uriToPrefixedUri(row.c),
            min: parseInt(row.minCount),
            max: parseInt(row.maxCount),
            average: parseFloat(row.avgCount),
            nbDataset: parseInt(row.countDataset),
        };
    });
    entityDataset = entityDataset.filter((row) => {
        return row.nbDataset > 1;
    });
    entityDataset = entityDataset.sort((a, b) => {
        if (a.nbDataset > b.nbDataset) {
            return -1;
        }
        if (a.nbDataset < b.nbDataset) {
            return 1;
        }
        return 0;
    });
    entityDataset.forEach((row) => {
        classCardinality.set(row.class, row.average);
    });
    return Global.readFile("class_property_object-class_MinMaxAverage_NbDatasets.csv").then(cpocData => {
        const csvData = csv.parse(cpocData, { columns: true, delimiter: ',' });
        let nonLiteralPropertyDataset = csvData.map((row) => {
            return {
                class: uriToPrefixedUri(row.c),
                property: uriToPrefixedUri(row.p),
                objectClass: uriToPrefixedUri(row.oc),
                min: parseInt(row.minAllC),
                max: parseInt(row.maxAllC),
                average: parseFloat(row.averageAll),
                nbDataset: parseInt(row.countAllDataset),
            };
        });
        nonLiteralPropertyDataset = nonLiteralPropertyDataset.sort((a, b) => {
            if (a.nbDataset > b.nbDataset) {
                return -1;
            }
            if (a.nbDataset < b.nbDataset) {
                return 1;
            }
            return 0;
        });
        Logger.log(JSON.stringify(classCardinality));
        const watdivNonLiteralProperties = classPropertyObjectClassToWatdivNonLiteralProperties(nonLiteralPropertyDataset, classCardinality);
        return Global.readFile("class_property_object-datatype_MinMaxAverageOccurrences_MinMaxValues_NbDatasets.csv").then(cpodData => {
            const csvData = csv.parse(cpodData, { columns: true, delimiter: ',' });
            let literalPropertyDataset = csvData.map((row) => {
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
                };
            });
            literalPropertyDataset = literalPropertyDataset.sort((a, b) => {
                if (a.nbDataset > b.nbDataset) {
                    return -1;
                }
                if (a.nbDataset < b.nbDataset) {
                    return 1;
                }
                return 0;
            });
            const watdivEntities = classInstancesToWatdivEntityDeclaration(entityDataset, literalPropertyDataset, classCardinality);
            return Global.writeFile("watdiv_config.txt", namespacesToWatdivPrefixes() + watdivEntities /* + watdivNonLiteralProperties*/);
        });
    });
});
function classInstancesToWatdivEntityDeclaration(entityDataset, literalPropertyDataset, classCardinality) {
    let watdiv = "";
    entityDataset.forEach((row) => {
        const classLiteralPropertiesDeclarations = classPropertyObjectDatatypeToWatdivLiteralProperties(row.class, literalPropertyDataset, classCardinality);
        watdiv += `<type*> ${row.class} ${row.min}\n${classLiteralPropertiesDeclarations}</type>\n`;
    });
    return watdiv;
}
function classPropertyObjectClassToWatdivNonLiteralProperties(dataset, classCardinality) {
    let watdiv = "";
    dataset.forEach((row) => {
        const subjectCardinality = classCardinality.get(row.class);
        const objectCardinality = classCardinality.get(row.objectClass);
        if (subjectCardinality !== undefined && objectCardinality !== undefined) {
            watdiv += `#association ${row.class} ${row.property} ${row.objectClass} ${subjectCardinality} ${row.min}[uniform] ${row.nbDataset / totalNumberOfDataset}\n`;
        }
    });
    return watdiv;
}
function classPropertyObjectDatatypeToWatdivLiteralProperties(className, dataset, classCardinality) {
    let watdiv = "";
    let filteredDataset = dataset.filter((row) => { return row.class === className; });
    filteredDataset.forEach((row) => {
        const subjectCardinality = classCardinality.get(row.class);
        if (subjectCardinality !== undefined) {
            const literalType = datatypeToWatdivLiteralType(row.objectDatatype);
            watdiv += `<pgroup> ${row.nbDataset / totalNumberOfDataset}\n#predicate ${row.property} ${literalType}\n</pgroup>\n`;
        }
    });
    return watdiv;
}
function namespacesToWatdivPrefixes() {
    let watdiv = "";
    for (const [namespace, prefix] of namespacePrefixMap.entries()) {
        if (namespace !== undefined && prefix !== undefined) {
            watdiv += `#namespace\t${prefix}=${namespace}\n`;
        }
    }
    return watdiv;
}
function datatypeToWatdivLiteralType(datatype) {
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
function namespaceToPrefix(namespace) {
    if (namespacePrefixMap.has(namespace)) {
        return namespacePrefixMap.get(namespace);
    }
    const prefix = `ns${namespacePrefixMap.size}`;
    namespacePrefixMap.set(namespace, prefix);
    return prefix;
}
function prefixToNamespace(prefix) {
    for (const [key, value] of namespacePrefixMap.entries()) {
        if (value === prefix) {
            return key;
        }
    }
    return null;
}
function extractNamepaceFromUri(uri) {
    let result = "FAILED";
    const regex = /(([a-zA-Z0-9-]+:\/\/)(([a-zA-Z0-9\-_]+\.)*[a-zA-Z0-9\-_]*(\/[a-zA-Z0-9\-\._:]+)*)[#\/])([a-zA-Z0-9\-_:\=]+)([a-zA-Z0-9\-_:\?\=]+)*/g;
    const match = regex.exec(uri);
    if (match) {
        return match[1]; // Le namespace de l'URI se trouve dans le groupe 1
    }
}
function uriToPrefixedUri(uri) {
    const namespace = extractNamepaceFromUri(uri);
    const prefix = namespaceToPrefix(namespace);
    if (namespace !== undefined && prefix !== undefined) {
        return uri.replace(namespace, prefix + ":");
    }
    else {
        return uri;
    }
}
