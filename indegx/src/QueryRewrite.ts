import dayjs from "dayjs";
import * as $rdf from "rdflib";
import * as util from "node:util"
import { XSD } from "./RDFUtils.js";
import * as Logger from "./LogUtils.js"

/**
    Replaces all occurrences of a regular expression in a given input string with a replacement string.
    @param {string} inputString - The string to search for matches in.
    @param {RegExp} regex - The regular expression to match against the input string.
    @param {string} replaceString - The string to replace matches with.
    @returns A new string with all matches replaced.
    */
function regexReplaceAll(inputString: string, regex: RegExp, replaceString: string): string {
    let result = inputString;

    function replacer(correspondance) {
        return replaceString;
    }

    return result.replace(regex, replacer);
}

/**
    A replacement object for various placeholders in a given input string.
    */
export interface PlaceholderReplacementObject {
    endpointUrlString: string,
    queryString?: string,
    testString?: string,
    startTime?: dayjs.Dayjs,
    endTime?: dayjs.Dayjs,
    reasonString?
}

/**
    Placeholder for a query string in a given input string.
    */
const queryPlaceholder = "$query"
const queryPlaceholderRegex = /\$query/g

/**
    Placeholder for a test string in a given input string.
    */
const testPlaceholder = "$test"
const testPlaceholderRegex = /\$test/g

/**
    Placeholder for a start time in a given input string.
    */
const startTimePlaceholder = "$startTime"
const startTimePlaceholderRegex = /\$startTime/g

/**
    Placeholder for an end time in a given input string.
    */
const endTimePlaceholder = "$endTime"
const endTimePlaceholderRegex = /\$endTime/g

/**
    Placeholder for a reason string in a given input string.
    */
const reasonPlaceholder = "$reason"
const reasonPlaceholderRegex = /\$reason/g

/**
Replaces all placeholders in a given input string with their corresponding values in the provided replacement object.
@param {string} inputString - The input string containing placeholders to replace.
@param {PlaceholderReplacementObject} keywordReplacementObject - The replacement object containing values to replace placeholders with.
@returns {string} A new string with all placeholders replaced with their corresponding values.
@throws An error if a required placeholder is not given in the replacement object.
*/
export function replacePlaceholders(inputString: string, keywordReplacementObject: PlaceholderReplacementObject): string {
    let result = inputString;
    result = regexReplaceAll(result, /\$rawEndpointUrl/g, $rdf.sym(keywordReplacementObject.endpointUrlString).toNT());
    if (result.includes(queryPlaceholder)) {
        if (keywordReplacementObject.queryString !== undefined) {
            const queriesStringLiteral = $rdf.literal(keywordReplacementObject.queryString);
            result = regexReplaceAll(result, queryPlaceholderRegex, queriesStringLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword " + queryPlaceholder + " given as input for " + result)
        }
    }
    if (result.includes(testPlaceholder)) {
        if (keywordReplacementObject.testString !== undefined) {
            const testStringLiteral = $rdf.sym(keywordReplacementObject.testString);
            result = regexReplaceAll(result, testPlaceholderRegex, testStringLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword " + testPlaceholder + " given as input for " + result)
        }
    }
    if (result.includes(startTimePlaceholder)) {
        if (keywordReplacementObject.startTime !== undefined) {
            const startTimeLiteral = $rdf.literal(keywordReplacementObject.startTime.toISOString(), XSD("datetime"))
            result = regexReplaceAll(result, startTimePlaceholderRegex, startTimeLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword " + startTimePlaceholder + " given as input for " + result)
        }
    }
    if (result.includes(endTimePlaceholder)) {
        if (keywordReplacementObject.endTime !== undefined) {
            const endTimeLiteral = $rdf.literal(keywordReplacementObject.endTime.toISOString(), XSD("datetime"))
            result = regexReplaceAll(result, endTimePlaceholderRegex, endTimeLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword " + endTimePlaceholder + " given as input for " + result)
        }
    }
    if (result.includes(reasonPlaceholder)) {
        if (keywordReplacementObject.reasonString !== undefined){ 
            let errorStringLiteral;
            if(JSON.stringify(keywordReplacementObject.reasonString).length < 2000) {
                errorStringLiteral = $rdf.literal(JSON.stringify(keywordReplacementObject.reasonString));
            } else {
                errorStringLiteral = $rdf.literal(JSON.stringify(keywordReplacementObject.reasonString).substring(0, 2000) + " ...");
            }
            result = regexReplaceAll(result, reasonPlaceholderRegex, errorStringLiteral.toNT());
        } else {
            throw new Error("No replacement for keyword " + reasonPlaceholder + " given as input for " + result)
        }
    }
    return result;
}
