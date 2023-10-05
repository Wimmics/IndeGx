#!/bin/bash

[ ! -d "input/" ] && mkdir input/
[ ! -d "output/" ] && mkdir output/
[ ! -d "output/tmp/" ] && mkdir output/tmp/
[ ! -d "output/tmp/pre/" ] && mkdir output/tmp/pre/
[ ! -d "output/tmp/main/" ] && mkdir output/tmp/main/

containerName=`sed 's/\///g' < <(pwd)`
containerName=`sed 's/.*/\L&/g' < <(echo "$containerName")`

echo "INDEGX_ARGS=$*" > .env

docker-compose -p $containerName up --abort-on-container-exit --build