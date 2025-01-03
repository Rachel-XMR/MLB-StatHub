from flask import Flask, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True)
