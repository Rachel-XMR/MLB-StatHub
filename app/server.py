from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from flask_bcrypt import Bcrypt, check_password_hash, generate_password_hash
import psycopg2
import os
from dotenv import load_dotenv
import jwt
from datetime import datetime, timezone, timedelta

load_dotenv()

app = Flask(__name__)

# Database connection
url = os.getenv('DATABASE_URL')
connection = psycopg2.connect(url)

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
TOKEN_EXPIRATION_TIME = 3600

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
                "mlbDebutDate": player.get("mlbDebutDate", "N/A"),
                "batSide": player.get("batSide", {}).get("description"),
                "pitchHand": player.get("pitchHand", {}).get("description"),
                "strikeZoneTop": player.get("strikeZoneTop"),
                "strikeZoneBottom": player.get("strikeZoneBottom"),
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
        hashed_password = generate_password_hash(password).decode('utf-8')

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
        new_user = cur.fetchone()
        cur.close()

        # Generate JWT token
        token = jwt.encode(
            {
                "user_id": new_user[0],
                "exp": datetime.now(timezone.utc) + timedelta(seconds=TOKEN_EXPIRATION_TIME),
            },
            SECRET_KEY,
            algorithm="HS256",
        )

        return jsonify({
            "message": "User signed up successfully",
            "user": {
                "id": new_user[0],
                "username": new_user[1],
                "email": new_user[2]
            },
            "token": token
        }), 201


    except psycopg2.Error as e:
        connection.rollback()
        if e.pgcode == '23505':
            return jsonify({"error": "Username or email already exists"}), 409
        return jsonify({"error": "Database error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/login", methods=["POST"])
def login_user():
    # Fetch the user email and password, hash the password,
    # compare it with the hashed password from the database
    try:
        login_data = request.get_json()
        email = login_data.get("email")
        password = login_data.get("password")

        if not all([email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        # Query database for user with provided email
        cur = connection.cursor()
        select_query = """
                SELECT id, username, email, password
                FROM user_data
                WHERE email = %s;
            """

        cur.execute(select_query, (email,))
        user = cur.fetchone()
        cur.close()

        if user is None:
            return jsonify({"error": "Invalid email or password"}), 401

        # Check if the password provided is correct
        if not check_password_hash(user[3], password):
            return jsonify({"error": "Invalid email or password"}), 401


        token = jwt.encode(
            {
                "user_id": user[0],
                "exp": datetime.now(timezone.utc) + timedelta(seconds=TOKEN_EXPIRATION_TIME),
            },
            SECRET_KEY,
            algorithm="HS256",
        )

        # If credentials are valid, return success response
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user[0],
                "email": user[2],
                "username": user[1]
            },
            "token": token
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/players/images", methods=["GET"])
def get_player_images():
    # Fetch the headshot image of each player from the database
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        # Get user's player IDs
        cur = connection.cursor()
        select_query = """
            SELECT unnest(player_id) as player_id
            FROM user_data 
            WHERE id = %s
            ORDER BY added_at DESC;
        """
        cur.execute(select_query, (user_id,))
        player_ids = [row[0] for row in cur.fetchall()]
        cur.close()

        # Fetch headshot URLs
        player_images = {}
        for player_id in player_ids:
            player_images[player_id] = f'https://securea.mlb.com/mlb/images/players/head_shot/{player_id}.jpg'

        return jsonify(player_images), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/get_username", methods=["GET"])
def get_username():
    # Fetch the username of the user associated with the provided JWT token
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        # Query database to get username
        cur = connection.cursor()
        select_query = """
            SELECT username 
            FROM user_data 
            WHERE id = %s;
        """
        cur.execute(select_query, (user_id,))
        username = cur.fetchone()[0]
        cur.close()

        return jsonify({"username": username}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/verify-token", methods=["POST"])
def verify_token():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return jsonify({"message": "Token is valid", "user_id": payload["user_id"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401


@app.route("/user/players", methods=["GET"])
def get_user_players():
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        # Verify token and get user_id
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        # Query database for user's selected players
        cur = connection.cursor()
        select_query = """
            SELECT unnest(player_id) as player_id
            FROM user_data 
            WHERE id = %s
            ORDER BY added_at DESC;
        """
        cur.execute(select_query, (user_id,))
        player_ids = [row[0] for row in cur.fetchall()]
        cur.close()

        players = []
        for player_id in player_ids:
            api_url = f"https://statsapi.mlb.com/api/v1/people/{player_id}/"
            response = requests.get(api_url)
            if response.status_code == 200:
                data = response.json()
                if data.get("people"):
                    player = data["people"][0]
                    players.append({
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
                        "mlbDebutDate": player.get("mlbDebutDate", "N/A"),
                        "batSide": player.get("batSide", {}).get("description"),
                        "pitchHand": player.get("pitchHand", {}).get("description"),
                        "strikeZoneTop": player.get("strikeZoneTop"),
                        "strikeZoneBottom": player.get("strikeZoneBottom")
                    })

        return jsonify(players), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/user/players", methods=["POST"])
def add_player():
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        player_data = request.get_json()
        player_id = player_data.get("player_id")

        # Ensure player_id is converted to an integer
        try:
            player_id = int(player_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid player ID"}), 400

        # Check if player already exists for user
        cur = connection.cursor()
        check_query = """
            SELECT EXISTS(
                SELECT 1 
                FROM user_data 
                WHERE id = %s AND %s = ANY(player_id)
            );
        """
        cur.execute(check_query, (user_id, player_id))
        exists = cur.fetchone()[0]

        if exists:
            cur.close()
            return jsonify({"error": "Player already added"}), 409

        # Add player to user's list
        insert_query = """
            UPDATE user_data 
            SET player_id = array_append(COALESCE(player_id, ARRAY[]::INTEGER[]), %s),
                added_at = NOW()
            WHERE id = %s;
        """
        cur.execute(insert_query, (player_id, user_id))
        connection.commit()
        cur.close()

        return jsonify({"message": "Player added successfully"}), 201

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/user/players/<int:player_id>", methods=["DELETE"])
def remove_player(player_id):
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        # Remove player from user's list
        cur = connection.cursor()
        delete_query = """
            UPDATE user_data 
            SET player_id = array_remove(player_id, %s)
            WHERE id = %s;
        """
        cur.execute(delete_query, (player_id, user_id))
        connection.commit()
        cur.close()

        return jsonify({"message": "Player removed successfully"}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/user/change_password", methods=["POST"])
def change_password():
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        # Retrieve old & new password
        password_data = request.get_json()
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")

        # Verify current password
        cur = connection.cursor()
        select_query = """
            SELECT password 
            FROM user_data 
            WHERE id = %s;
        """
        cur.execute(select_query, (user_id,))
        stored_password = cur.fetchone()[0]

        if not check_password_hash(stored_password, current_password):
            cur.close()
            return jsonify({"error": "Incorrect current password"}), 401

        # Update password
        update_query = """
            UPDATE user_data 
            SET password = %s
            WHERE id = %s;
        """
        new_hashed_password = generate_password_hash(new_password).decode('utf-8')
        cur.execute(update_query, (new_hashed_password, user_id))
        connection.commit()
        cur.close()

        return jsonify({"message": "Password changed successfully"}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        connection.rollback()
        return jsonify({"error": str(e)}), 500


def get_team_for_player(player_id):
    """Finds the team a player plays for (using roster search)."""
    teams_endpoint_url = 'https://statsapi.mlb.com/api/v1/teams?sportId=1'
    try:
        teams_response = requests.get(teams_endpoint_url)
        teams_response.raise_for_status()
        teams_data = teams_response.json()
        teams = teams_data.get("teams", [])

        for team in teams:
            team_id = team["id"]
            roster_url = f'https://statsapi.mlb.com/api/v1/teams/{team_id}/roster?season={datetime.now().year}'
            roster_response = requests.get(roster_url)
            roster_response.raise_for_status()
            roster_data = roster_response.json()
            roster = roster_data.get("roster", [])

            for player_entry in roster:
                roster_player_id = player_entry.get("person", {}).get("id")
                if roster_player_id == player_id:
                    return team["name"], team_id

        return None, None  # Player not found

    except requests.exceptions.RequestException as e:
        print(f"Error fetching team/roster: {e}")
        return None, None


@app.route("/user/players/teams", methods=["GET"])
def get_user_player_teams():
    """Get the teams based on player id from the database"""
    token = request.headers.get("Authorization", "").split("Bearer ")[-1].strip()
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]

        cur = connection.cursor()
        select_query = """
            SELECT unnest(player_id) as player_id
            FROM user_data 
            WHERE id = %s
            ORDER BY added_at DESC;
        """
        cur.execute(select_query, (user_id,))
        player_ids = [row[0] for row in cur.fetchall()]
        cur.close()

        player_teams = {}
        for player_id in player_ids:
            team_name, team_id = get_team_for_player(player_id)  #
            if team_name:
                player_teams[player_id] = {"teamName": team_name, "teamId": team_id}
            else:
                player_teams[player_id] = {"teamName": "Team not found"}

        return jsonify(player_teams), 200

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return jsonify({"message": "Welcome to the MLB Server API"})

if __name__ == "__main__":
    app.run(host='localhost', port=5000, debug=True)