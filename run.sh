#!/bin/bash

[ ! -d "input/" ] && mkdir input/
[ ! -d "output/" ] && mkdir output/

containerName=`sed 's/\///g' < <(pwd)`
containerName=`sed 's/.*/\L&/g' < <(echo "$containerName")`

docker-compose -p $containerName up --abort-on-container-exit --build