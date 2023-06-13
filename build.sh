#! /bin/sh

[ ! -d "input/" ] && mkdir input/
[ ! -d "output/" ] && mkdir output/

docker-compose build