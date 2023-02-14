import dayjs from "dayjs";
import * as $rdf from "rdflib";
import * as util from "node:util"
import { XSD } from "./RDFUtils.js";
import * as Logger from "./LogUtils.js"

function regexReplaceAll(inputString: string, regex: RegExp, replaceString: string) : string {
    let result = inputString;

    function replacer(correspondance) {
        return replaceString;
    }

    return result.replace(regex, replacer);
}

export interface PlaceholderReplacementObject {
    endpointUrlString: string,
    queryString?: string,
    testString?: string,
    startTime?: dayjs.Dayjs,
    endTime?: dayjs.Dayjs,
    reasonString?
}

const queryPlaceholder = "$query"
const queryPlaceholderRegex = /\$query/g
const testPlaceholder = "$test"
const testPlaceholderRegex = /\$test/g
const startTimePlaceholder = "$startTime"
const startTimePlaceholderRegex = /\$startTime/g
const endTimePlaceholder = "$endTime"
const endTimePlaceholderRegex = /\$endTime/g
const reasonPlaceholder = "$reason"
const reasonPlaceholderRegex = /\$reason/g

export function replacePlaceholders(inputString: string, keywordReplacementObject: PlaceholderReplacementObject) {
    let result = inputString;
    result = regexReplaceAll(result, /\$rawEndpointUrl/g, $rdf.sym(keywordReplacementObject.endpointUrlString).toNT());
    if(result.includes(queryPlaceholder)) {
        if (keywordReplacementObject.queryString !== undefined) {
                const queriesStringLiteral = $rdf.literal(keywordReplacementObject.queryString);
                result = regexReplaceAll(result, queryPlaceholderRegex, queriesStringLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword "+ queryPlaceholder + " given as input for " + result)
        }
    } 
    if(result.includes(testPlaceholder)) {
        if (keywordReplacementObject.testString !== undefined) {
            const testStringLiteral = $rdf.sym(keywordReplacementObject.testString);
            result = regexReplaceAll(result, testPlaceholderRegex, testStringLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword "+ testPlaceholder + " given as input for " + result)
        }
    }
    if(result.includes(startTimePlaceholder)) {
        if (keywordReplacementObject.startTime !== undefined) {
            const startTimeLiteral = $rdf.literal(keywordReplacementObject.startTime.toISOString(), XSD("datetime"))
            result = regexReplaceAll(result, startTimePlaceholderRegex, startTimeLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword "+ startTimePlaceholder + " given as input for " + result)
        }
    } 
    if(result.includes(endTimePlaceholder)) {
        if (keywordReplacementObject.endTime !== undefined) {
            const endTimeLiteral = $rdf.literal(keywordReplacementObject.endTime.toISOString(), XSD("datetime"))
            result = regexReplaceAll(result, endTimePlaceholderRegex, endTimeLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword "+ endTimePlaceholder + " given as input for " + result)
        }
    } 
    if(result.includes(reasonPlaceholder)) {
        if (keywordReplacementObject.reasonString !== undefined) {
            const errorStringLiteral = $rdf.literal(JSON.stringify(keywordReplacementObject.reasonString));
            result = regexReplaceAll(result, reasonPlaceholderRegex, errorStringLiteral.toNT());
        }else {
            throw new Error("No replacement for keyword "+ reasonPlaceholder + " given as input for " + result)
        }
    } 
    return result;
}
