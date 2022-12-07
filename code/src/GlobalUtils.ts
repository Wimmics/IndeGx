import fetch, { FetchError } from 'node-fetch';
import { RequestInit, HeadersInit } from 'node-fetch';
import * as fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import * as Logger from "./LogUtils.js"

const nbFetchRetries = 10;
const millisecondsBetweenRetries = 5000;

export function appendToFile(filename, content) {
    fs.writeFile(filename, content, { flag: 'a+' }).catch(err => {
        Logger.error(err);
    });
}

export function writeFile(filename, content) {
    fs.writeFile(filename, content).catch(err => {
        Logger.error(err);
    });
}

export function readFile(filename: string): Promise<string> {
    var readFilePromise = null;
    if (filename.startsWith("http://") || filename.startsWith("https://")) {
        readFilePromise = fetchGETPromise(filename)
    } else if (filename.startsWith("file://")) {
        readFilePromise = fs.readFile(filename.replace("file://", "")).then(buffer => buffer.toString())
    } else {
        readFilePromise = fs.readFile(filename).then(buffer => buffer.toString())
    }
    return readFilePromise;
}

type promiseCreationFunction = {
    (...args: any[]): Promise<any>;
}

export function iterativePromises(args: Array<Array<any>>, promiseCreationFunction: promiseCreationFunction): Promise<any> {
    var argsCopy = args.map(arg => arg);
    if (argsCopy.length > 0) {
        return promiseCreationFunction.apply(this, argsCopy[0]).then(() => {
            argsCopy.shift();
            return iterativePromises(argsCopy, promiseCreationFunction);
        })
    }
    return new Promise<void>((resolve, reject) => resolve());
}

export function fetchPromise(url, header = new Map(), method = "GET", query = "", numTry = 0) {
    var myHeaders = new Map();
    myHeaders.set('pragma', 'no-cache');
    myHeaders.set('cache-control', 'no-cache');
    header.forEach((value, key) => {
        myHeaders.set(key, value);
    });
    var myInit: RequestInit = {
        method: method,
        headers: myHeaders,
        // mode: 'cors',
        // cache: 'no-cache',
        redirect: 'follow',
    };
    if (method.localeCompare("POST") == 0) {
        myInit.body = query;
    }
    return fetch(url, myInit)
        .then(response => {
            if (response.ok) {
                return response.blob().then(blob => blob.text())
            } else {
                throw response;
            }
        }).catch(error => {
            if(error instanceof FetchError) {
                Logger.error(error.type, error.message)
                Logger.info("Try:",numTry, "Fetch " , method , url , query );
                if(numTry < nbFetchRetries) {
                    return setTimeout(millisecondsBetweenRetries).then(fetchPromise(url, header, method, query, numTry+1));
                } else {
                    throw error;
                }
            } else {
                throw error;
            }
        });
}

export function fetchGETPromise(url, header = new Map()) {
    return fetchPromise(url, header);
}

export function fetchPOSTPromise(url, query = "", header = new Map()) {
    return fetchPromise(url, header, "POST", query);
}

export function fetchJSONPromise(url, otherHeaders = new Map()) {
    var header = new Map();
    header.set('Content-Type', 'application/json');
    otherHeaders.forEach((value, key) => {
        header.set(key, value)
    })
    return fetchPromise(url, header).then(response => {
        try {
            return JSON.parse(response);
        } catch (error) {
            Logger.error(url, error, response)
            throw error
        }
    });
}

export function urlToBaseURI(url: string) {
    const baseURI = url.replace(new RegExp("/^(?:.*\/)*([^\/\r\n]+?|)(?=(?:\.[^\/\r\n.\.]*\.)?$)/gm"), "");
    return baseURI;
}
