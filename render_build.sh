#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

pip install pipenv

pipenv install

echo $DATABASE_URL

pipenv run upgrade
