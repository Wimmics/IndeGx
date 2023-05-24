#! /bin/sh

# Start the corese server
nohup java -jar /corese/corese-server-4.4.0.jar -init /corese/corese-server.properties -su &

cd /indegx/code
npm run run

# Start the IndeGx app
# node /indegx/code/src/Indegx.js