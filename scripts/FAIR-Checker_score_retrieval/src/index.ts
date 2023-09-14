import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';

import * as Logger from "./LogUtils.js"
import * as Global from "./GlobalUtils.js"

const endpointKGList = 'FAIRSavoir_KGs.csv'

const staticKGEndpointList = parse(fs.readFileSync(endpointKGList), { columns: true });
let resultMap = new Map<string, Global.JSONObject>();

let promiseArgArray = staticKGEndpointList.map((row: any) => {
    const kgURI = row['kg_FAIR'];
    return [ "https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(kgURI)]
});

function promiseCreationFunction(kgURI: string) {
    const headers = { 'Accept': 'application/json' };
    return Global.fetchJSONPromise("https://fair-checker.france-bioinformatique.fr/api/check/metrics_all?url=" + Global.unicodeToUrlendcode(kgURI), headers).then((response: Global.JSONArray) => {
        Logger.log(kgURI, response);
        resultMap.set(kgURI, { kg: kgURI, F1A: 0, F1B: 0, F2A: 0, F2B: 0, A11: 0, A12: 0, I1: 0, I2: 0, I3: 0, R11: 0, R12: 0, R13: 0 });
        response.forEach((metric: Global.JSONValue) => {
            let metricKg = metric['target_uri'];
            if (metricKg == kgURI) {
                let metricName = metric['metric'];
                let metricValue = metric['score'];
                if (metricName == 'F1A') {
                    resultMap.get(kgURI)['F1A'] = metricValue;
                } else if (metricName == 'F1B') {
                    resultMap.get(kgURI)['F1B'] = metricValue;
                } else if (metricName == 'F2A') {
                    resultMap.get(kgURI)['F2A'] = metricValue;
                } else if (metricName == 'F2B') {
                    resultMap.get(kgURI)['F2B'] = metricValue;
                } else if (metricName == 'A1.1') {
                    resultMap.get(kgURI)['A11'] = metricValue;
                } else if (metricName == 'A12') {
                    resultMap.get(kgURI)['A1.2'] = metricValue;
                } else if (metricName == 'I1') {
                    resultMap.get(kgURI)['I1'] = metricValue;
                } else if (metricName == 'I2') {
                    resultMap.get(kgURI)['I2'] = metricValue;
                } else if (metricName == 'I3') {
                    resultMap.get(kgURI)['I3'] = metricValue;
                } else if (metricName == 'R1.1') {
                    resultMap.get(kgURI)['R11'] = metricValue;
                } else if (metricName == 'R1.2') {
                    resultMap.get(kgURI)['R12'] = metricValue;
                } else if (metricName == 'R1.3') {
                    resultMap.get(kgURI)['R13'] = metricValue;
                }
            }
        });
        return;
    }).catch((error: any) => {
        Logger.error(JSON.stringify(error));
    });
}

Logger.log(JSON.stringify(promiseArgArray));
Global.iterativePromises(promiseArgArray, promiseCreationFunction, 10).then(() => {
    Logger.log(resultMap);
    let csv = "kg,F1A,F1B,F2A,F2B,A11,A12,I1,I2,I3,R11,R12,R13\n";
    resultMap.forEach((value: Global.JSONObject, key: string) => {
        csv += key + "," + value['F1A'] + "," + value['F1B'] + "," + value['F2A'] + "," + value['F2B'] + "," + value['A11'] + "," + value['A12'] + "," + value['I1'] + "," + value['I2'] + "," + value['I3'] + "," + value['R11'] + "," + value['R12'] + "," + value['R13'] + "\n";
    }
    );
    fs.writeFileSync("FAIR-Checker_score_retrieval.csv", csv);
}).catch((error: any) => {
    Logger.error(error);
});