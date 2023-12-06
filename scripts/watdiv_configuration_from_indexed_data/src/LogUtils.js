import dayjs from "dayjs";
import * as util from "node:util";
import { appendToFile } from "./GlobalUtils.js";
export var LogLevel;
(function (LogLevel) {
    LogLevel["LOG"] = "LOG";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["INFO"] = "INFO";
})(LogLevel || (LogLevel = {}));
export const defaultLogFileName = "logs.log";
let logFileName = defaultLogFileName;
let defaultLogLevel = LogLevel.LOG;
/**
 * ERROR > INFO > LOG
 * @param level
 * @param logLevel
 */
function compareLogLevel(level, logLevel) {
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
export function setLogLevel(level) {
    defaultLogLevel = level;
}
export function setLogFileName(fileName) {
    if (fileName !== null && fileName !== undefined && fileName !== "") {
        logFileName = fileName;
    }
}
export function log(logObject, ...o) {
    logging(LogLevel.LOG, logObject, ...o);
}
export function error(logObject, ...o) {
    logging(LogLevel.ERROR, logObject, ...o);
}
export function info(logObject, ...o) {
    logging(LogLevel.INFO, logObject, ...o);
}
function logging(level, logObject, ...o) {
    if (compareLogLevel(level, defaultLogLevel) < 0) {
        return;
    }
    const now = dayjs();
    const message = util.format("[%s][%s]: %s", level, now.toISOString(), logObject, ...o);
    console.error(message);
    appendToFile(logFileName, message + "\n");
}
