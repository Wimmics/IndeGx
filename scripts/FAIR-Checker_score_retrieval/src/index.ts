import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as fs from 'node:fs';

import * as Logger from "./LogUtils.js"
import * as Global from "./GlobalUtils.js"

const endpointKGList = 'FAIRSavoir_KGs.csv'

const staticKGEndpointList = parse(fs.readFileSync(endpointKGList), { columns: true });
let resultMap = new Map<string, Global.JSONObject>();

let promiseArgArray = staticKGEndpointList.map((row: any) => {
    const kgURI = row['kg_FAIR'];
    return ["https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(kgURI)]
});

function promiseCreationFunction(kgURI: string) {
    const headers = { 'Accept': 'application/json' };
    return Global.fetchJSONPromise("https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + kgURI, headers).then((response: Global.JSONArray) => {
        Logger.log(kgURI, response);
        fs.appendFileSync("FAIR-Checker_score_retrieval.json", JSON.stringify(response) + "\n");
        resultMap.set(kgURI, { kg: kgURI, F1A: 0, F1B: 0, F2A: 0, F2B: 0, A11: 0, A12: 0, I1: 0, I2: 0, I3: 0, R11: 0, R12: 0, R13: 0 });
        response.forEach((metric: Global.JSONValue) => {
            Logger.log(JSON.stringify(metric))
            let metricKg = metric['target_uri'];
            let metricName = metric['metric'];
            let metricValue = metric['score'];
            if (metricName.localeCompare('F1A') == 0) {
                resultMap.get(kgURI)['F1A'] = metricValue;
            } else if (metricName.localeCompare('F1B') == 0) {
                resultMap.get(kgURI)['F1B'] = metricValue;
            } else if (metricName.localeCompare('F2A') == 0) {
                resultMap.get(kgURI)['F2A'] = metricValue;
            } else if (metricName.localeCompare('F2B') == 0) {
                resultMap.get(kgURI)['F2B'] = metricValue;
            } else if (metricName.localeCompare('A1.1') == 0) {
                resultMap.get(kgURI)['A11'] = metricValue;
            } else if (metricName.localeCompare('A1.2') == 0) {
                resultMap.get(kgURI)['A12'] = metricValue;
            } else if (metricName.localeCompare('I1') == 0) {
                resultMap.get(kgURI)['I1'] = metricValue;
            } else if (metricName.localeCompare('I2') == 0) {
                resultMap.get(kgURI)['I2'] = metricValue;
            } else if (metricName.localeCompare('I3') == 0) {
                resultMap.get(kgURI)['I3'] = metricValue;
            } else if (metricName.localeCompare('R1.1') == 0) {
                resultMap.get(kgURI)['R11'] = metricValue;
            } else if (metricName.localeCompare('R1.2') == 0) {
                resultMap.get(kgURI)['R12'] = metricValue;
            } else if (metricName.localeCompare('R1.3') == 0) {
                resultMap.get(kgURI)['R13'] = metricValue;
            }
        });
        return;
    }).catch((error: any) => {
        Logger.error(JSON.stringify(error));
    });
}

Logger.log(JSON.stringify(promiseArgArray));
Global.iterativePromises(promiseArgArray, promiseCreationFunction, 10).then(() => {
    let csvObject: Global.JSONValue[][] = [["kg", "F1A", "F1B", "F2A", "F2B", "A11", "A12", "I1", "I2", "I3", "R11", "R12", "R13"]];
    resultMap.forEach((value: Global.JSONObject, key: string) => {
        Logger.log(key, value);
        csvObject.push([key, value['F1A'], value['F1B'], value['F2A'], value['F2B'], value['A11'], value['A12'], value['I1'], value['I2'], value['I3'], value['R11'], value['R12'], value['R13']]);
    }
    );
    Logger.log("Result:", csvObject)
    fs.writeFileSync("FAIR-Checker_score_retrieval.csv", stringify(csvObject));
}).catch((error: any) => {
    Logger.error(error);
});