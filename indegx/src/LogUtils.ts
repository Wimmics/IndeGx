import dayjs from "dayjs"
import * as util from "node:util"
import { appendToFile, writeFile } from "./GlobalUtils.js";

export enum LogLevel {
    LOG = "LOG",
    ERROR = "ERROR",
    INFO = "INFO"
}

let logFileName = "indegx.log"
let defaultLogLevel = LogLevel.LOG;

/**
 * ERROR > INFO > LOG
 * @param level 
 * @param logLevel 
 */
function compareLogLevel(level: LogLevel, logLevel: LogLevel): number {
    if (level == logLevel) {
        return 0;
    }
    if (level == LogLevel.ERROR) {
        return 1;
    }
    if (level == LogLevel.INFO && logLevel == LogLevel.LOG) {
        return 1;
    }
    return -1;
}

export function setLogLevel(level: LogLevel) {
    defaultLogLevel = level;
}

export function setLogFileName(fileName: string) {
    if(fileName == null || fileName == undefined || fileName == "") {
        logFileName = "indegx.log";
    } else {
        logFileName = fileName;
    }
}

export function log(logObject: any, ...o: any[]) : void {
    logging(LogLevel.LOG, logObject, ...o);
}

export function error(logObject: any, ...o: any[]) : void {
    logging(LogLevel.ERROR, logObject, ...o);
}

export function info(logObject: any, ...o: any[]) : void {
    logging(LogLevel.INFO, logObject, ...o);
}

function logging(level: LogLevel, logObject: any, ...o: any[]): void {
    if (compareLogLevel(level, defaultLogLevel) < 0) {
        return;
    }
    const now = dayjs();
    const message = util.format("[%s][%s]: %s", level, now.toISOString(), logObject, ...o);
    console.error(message);
    appendToFile(logFileName, message + "\n");
}