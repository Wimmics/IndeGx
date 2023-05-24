#! /bin/sh

docker run indegx --mount type=bind,source=/input,target=/input --mount type=volume,source=/output,target=/output