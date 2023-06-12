#! /bin/sh

[ ! -d "input/" ] && mkdir input/
[ ! -d "output/" ] && mkdir output/

docker build --rm . -t indegx