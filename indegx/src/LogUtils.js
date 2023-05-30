import dayjs from "dayjs";
import * as util from "node:util";
import { appendToFile } from "./GlobalUtils.js";
let logFileName = "indegx.log";
export function setLogFileName(fileName) {
    if (fileName == null || fileName == undefined || fileName == "") {
        logFileName = "indegx.log";
    }
    else {
        logFileName = fileName;
    }
}
export function log(logObject, ...o) {
    logging("LOG", logObject, ...o);
}
export function error(logObject, ...o) {
    logging("ERROR", logObject, ...o);
}
export function info(logObject, ...o) {
    logging("INFO", logObject, ...o);
}
function logging(level, logObject, ...o) {
    const now = dayjs();
    const message = util.format("[%s][%s]: %s", level, now.toISOString(), logObject, ...o);
    console.error(message);
    appendToFile(logFileName, message + "\n");
}
