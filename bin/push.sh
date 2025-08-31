#!/bin/bash

cd "$(dirname $0)/.."

if [[ -z `git status -s` ]]; then
  echo "exec 'git push'"
  git push
  echo "exec 'bin/build.sh' $1"
  bin/build.sh
  echo "exec 'bin/deploy.sh'"
  bin/deploy.sh
else
  echo "Error: Please commit all changes."
fi