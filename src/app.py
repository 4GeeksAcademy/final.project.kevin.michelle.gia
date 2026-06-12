import os
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from flask_bcrypt import Bcrypt

from api.utils import APIException, generate_sitemap
from api.routes import api, bcrypt
from flask_jwt_extended import JWTManager
from api.utils import APIException, generate_sitemap
from api.models import db
from api.admin import setup_admin
from models import db
from flask_jwt_extended import JWTManager


app = Flask(__name__)
bcrypt = Bcrypt(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key")

db_url = os.getenv("DATABASE_URL")

if db_url is not None:
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace("postgres://", "postgresql://")
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

MIGRATE = Migrate(app, db)
db.init_app(app)
CORS(app)

jwt = JWTManager(app)
bcrypt.init_app(app)

# add the admin
setup_admin(app)
app.register_blueprint(api, url_prefix='/api')

#--------------------------------------

@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

@app.route("/")
def sitemap():
    return generate_sitemap(app)


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)

