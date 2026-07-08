#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

pip install pipenv

pipenv install

# If workshops table is missing, reset alembic so migrations run fresh
PYTHONPATH=src pipenv run python -c "
from app import app
from api.models import db
from sqlalchemy import inspect, text
with app.app_context():
    tables = inspect(db.engine).get_table_names()
    if 'workshops' not in tables:
        db.session.execute(text('DROP TABLE IF EXISTS alembic_version'))
        db.session.commit()
        print('Reset alembic_version — running migrations fresh')
"

PYTHONPATH=src pipenv run upgrade

# Verify tables were created
PYTHONPATH=src pipenv run python -c "
from app import app
from api.models import db
from sqlalchemy import inspect
with app.app_context():
    tables = sorted(inspect(db.engine).get_table_names())
    print('Tables in DB after migration:', tables)
"
