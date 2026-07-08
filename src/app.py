import os
from datetime import timedelta
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api, bcrypt
from api.admin import setup_admin

from api.cloudinary_config import configure_cloudinary

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

static_file_dir = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    "../dist/"
)


app = Flask(__name__)
app.url_map.strict_slashes = False

configure_cloudinary()

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

db_url = os.getenv("DATABASE_URL") or None
if db_url:
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace("postgres://", "postgresql://")
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
MIGRATE = Migrate(app, db)

CORS(app)

jwt = JWTManager(app)
bcrypt.init_app(app)

setup_admin(app)
app.register_blueprint(api, url_prefix="/api")


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.route("/")
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)

    return send_from_directory(
        static_file_dir,
        "index.html"
    )


@app.route("/<path:path>", methods=["GET"])
def serve_any_other_file(path):

    if not os.path.isfile(
        os.path.join(static_file_dir, path)
    ):
        path = "index.html"

    response = send_from_directory(
        static_file_dir,
        path
    )

    response.cache_control.max_age = 0

    return response


if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3001))

    app.run(
        host="0.0.0.0",
        port=PORT,
        debug=True
    )