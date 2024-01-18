
import * as fs from 'node:fs/promises';



function writeFile(filename, content) {
    fs.writeFile(filename, content, { flag: "w+" })
}

function readFile(filename: string): Promise<string> {
    let readFilePromise = null;
    if (filename.startsWith("file://")) {
        readFilePromise = fs.readFile(filename.replace("file://", "")).then(buffer => buffer.toString())
    } else {
        readFilePromise = fs.readFile(filename).then(buffer => buffer.toString())
    }
    return readFilePromise;
}

function replaceUnicode(text: string): string {
    return text.replace(/\\u[\dA-F]{4}/gi,
        function (match) {
            let unicodeMatch = String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
            let urlEncodedMatch = "";
            try {
                urlEncodedMatch = encodeURIComponent(unicodeMatch);
            } catch (error) {
            }
            return urlEncodedMatch;
        });
}

function fixCommonTurtleStringErrors(ttlString: string): string {
    if (ttlString == null || ttlString == undefined) {
        throw new Error("Invalid turtle string " + ttlString);
    } else {
        const betterRegexNodeB = /([\s|\n]+)((node|b)[^:\s]+)(\s)+/g;
        const betterRegexNodeBReplacement = "$1_:$2$4"
        const regexURIWithoutBracketsRegex = /(\s)(([a-zA-Z0-9-]+:\/\/(([a-zA-Z0-9-]+\.)?[a-zA-Z0-9-]+)+(\.[a-zA-Z0-9\-_:]+)\/)([a-zA-Z0-9\-_:])*)(\s+)/g
        const regexURIWithoutBracketsReplacement = "$1<$2>$8"
        const prefixedURIwithSlashesRegex = /([\s|\n]+)(([a-zA-Z0-9]+:)((\/[a-zA-Z0-9]*)+)+)([\s|\n]+)/g
        const prefixedURIwithSlashesRegexReplacement = "$1$3$6"
        const charactersThatAreNotSafeInURI = /\s*[\w\-\.!~\*'()?:;\/=\[\]+@&$,%#~<>"]*\s*([^<>\w\-\.!~\*'()?:;/=\[\]+@&$,%#~"\s^]+)\s*[\w\-\.!~\*'()?:;\/=\[\]+@&$,%#~<>"]*\s*/gm;
        let result = ttlString;
        console.log("Fixing common Turtle errors in file");
        console.log("Replacing nodeID:// by _: in file");
        result = result.replaceAll("nodeID://", "_:"); // Dirty hack to fix nodeID:// from Virtuoso servers for turtle
        console.log("Replacing genid- by _: in file");
        result = result.replaceAll("genid-", "_:"); // Dirty hack to fix blank nodes with genid- prefix
        console.log("Replacing b or node without : by _: in file");
        result = result.replaceAll(betterRegexNodeB, betterRegexNodeBReplacement); // Dirty hack to fix blank nodes with b or node prefix and without ":"
        console.log("Replacing properties with two : by properties with one : in file");
        result = result.replaceAll(regexURIWithoutBracketsRegex, regexURIWithoutBracketsReplacement); // Dirty hack ot remove property URIs that appear in Turtle returned by Corese when they have two ":". Should be fixed in Corese >4.4.1
        console.log("Replacing prefixed URIs with slashes by prefixed URIs without slashes in file");
        result = result.replaceAll(prefixedURIwithSlashesRegex, prefixedURIwithSlashesRegexReplacement) // Very dirty hack: Edit malformed prefixed URIs that contain slashes by removing everything after the first slash
        console.log("Replacing unicode characters in \\u1111 format by their URI encoded version in file");
        result = replaceUnicode(result); // Replace unicode characters in \u1111 format by their URI encoded version
        console.log("Replacing unsafe characters by their URI encoded version in file");
        result.match(charactersThatAreNotSafeInURI)?.forEach(match => { // Replace any non-encoded character in the file by its URL encoded version
            console.log("Replacing unsafe character " + match + " by its URI encoded version "+ encodeURIComponent(match) +" in file")
            result = result.replaceAll(match, encodeURIComponent(match));
        }); 
        return result;
    }
}

function fixCommonTurtleStringErrorsInFile(ttlFile: string): Promise<string> {
    return readFile(ttlFile).then(ttlString => fixCommonTurtleStringErrors(ttlString));
}

function fixCommonTurtleStringErrorsInFiles(ttlFiles: string[]): Promise<string[]> {
    return Promise.all(ttlFiles.map(ttlFile => fixCommonTurtleStringErrorsInFile(ttlFile)));
}

function getTurtleFilesInDirectory(directory: string): Promise<string[]> {
    return fs.readdir(directory).then(files => files.filter(file => file.endsWith(".ttl") || file.endsWith(".trig")).map(file => directory + "/" + file));
}

function getTurtleFilesInDirectories(directories: string[]): Promise<string[]> {
    return Promise.all(directories.map(directory => getTurtleFilesInDirectory(directory))).then(files => files.flat());
}

function main() {
    const files = process.argv.slice(2);
    console.log("Fixing common Turtle errors in files: " + files);
    return fixCommonTurtleStringErrorsInFiles(files).then(ttlStrings => ttlStrings.forEach((ttlString, index) => writeFile(files[index]+ ".new", ttlString)));
}

main();