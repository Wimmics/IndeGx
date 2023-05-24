#!/bin/bash

docker run --rm --mount type=bind,source=$(pwd)/input,target=/input --mount type=bind,source=$(pwd)/output,target=/output --mount type=bind,source=$(pwd)/config,target=/config indegx