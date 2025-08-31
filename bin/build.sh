#!/bin/bash

cd "$(dirname $0)/.."

node --env-file=.env inject.js $1