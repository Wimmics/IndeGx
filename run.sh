#!/bin/bash

docker run --mount type=bind,source=$(pwd)/input,target=/input --mount type=bind,source=$(pwd)/output,target=/output indegx