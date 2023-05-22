#! /bin/sh

# Start the corese server
nohup java -jar /corese/corese-server-4.4.0.jar -init /corese/corese-server.properties -su &

cd /IndeGx/code
# Start the IndeGx app
npm run run