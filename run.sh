#!/bin/bash

[ ! -d "input/" ] && mkdir input/
[ ! -d "output/" ] && mkdir output/

docker-compose up --abort-on-container-exit --build