#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

pip install pipenv

pipenv install

PYTHONPATH=src pipenv run python -c "
from app import app
from api.models import db
from flask_migrate import stamp
with app.app_context():
    db.create_all()
    stamp(revision='head')
    print('Tables created and alembic stamped at head')
"
