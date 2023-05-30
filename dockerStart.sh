#! /bin/sh

echo `pwd`
ls -lh

cd /indegx/config

echo `pwd`
ls -lh

cd /indegx

echo `pwd`
ls -lh

# Start the corese server
npm run start &
# Start the IndeGx app
npm run run