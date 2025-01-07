from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Database connection
url = os.getenv('DATABASE_URL')
connection = psycopg2.connect(url)

# Encryption
bcrypt = Bcrypt(app)

# (CORS) configuration
CORS(app, supports_credentials=True)

@app.route('/player/<int:player_id>', methods=['GET'])
def get_player_data(player_id):
    try:
        # Fetch data from the MLB API
        api_url = f"https://statsapi.mlb.com/api/v1/people/{player_id}/"
        response = requests.get(api_url)

        if response.status_code != 200:
            return jsonify({"error": "Player not found"}), 404

        data = response.json()

        # Extract player information
        if data.get("people"):
            player = data["people"][0]
            player_data = {
                "id": player.get("id"),
                "fullName": player.get("fullName"),
                "primaryNumber": player.get("primaryNumber"),
                "birthDate": player.get("birthDate"),
                "currentAge": player.get("currentAge"),
                "birthCity": player.get("birthCity"),
                "birthCountry": player.get("birthCountry"),
                "height": player.get("height"),
                "weight": player.get("weight"),
                "primaryPosition": player.get("primaryPosition", {}).get("name"),
                "nickName": player.get("nickName", "N/A"),
                "debutDate": player.get("mlbDebutDate", "N/A"),
                "batSide": player.get("batSide", {}).get("description"),
                "pitchHand": player.get("pitchHand", {}).get("description"),
            }
            return jsonify(player_data), 200
        else:
            return jsonify({"error": "Player data not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/signup", methods=["POST"])
def signup_user():
    try:
        user_data = request.get_json()
        username = user_data.get("username")
        password = user_data.get("password")
        email = user_data.get("email")

        if not all([username, password, email]):
            return jsonify({"error": "Missing required fields"}), 400

        # Encrypt password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Store user data in database
        cur = connection.cursor()

        # Insert user data
        insert_query = """
            INSERT INTO user_data (username, email, password)
            VALUES (%s, %s, %s)
            RETURNING id, username, email;
        """

        cur.execute(insert_query, (username, email, hashed_password))

        connection.commit()

        # Fetch a single row from the database
        new_user = cur.fetchone()

        cur.close()

        return jsonify({
            "message": "User signed up successfully",
            "user": {
                "id": new_user[0],
                "username": new_user[1],
                "email": new_user[2]
            }
        }), 201


    except psycopg2.Error as e:
        connection.rollback()
        if e.pgcode == '23505':
            return jsonify({"error": "Username or email already exists"}), 409
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return jsonify({"message": "Welcome to the MLB Server API"})

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)