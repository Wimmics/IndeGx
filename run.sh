#!/bin/bash

# docker run --rm --mount type=bind,source=$(pwd)/input,target=/input --mount type=bind,source=$(pwd)/output,target=/output --mount type=bind,source=$(pwd)/config,target=/indegx/config indegx

echo `ls -l ./input`
echo `ls -l ./output`
echo `ls -l ./config`

docker-compose up --abort-on-container-exit