#!/usr/bin/env bash

# Exit on error
set -o errexit

npm install
npm run build

pip install pipenv
pipenv install

PYTHONPATH=src pipenv run flask --app src/app.py db upgrade