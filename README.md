# MLB StatHub

## Description

MLB StatHub is a full-stack web application where users can sign up, log in, and follow their favorite MLB players. Users will receive personalized highlights of the games they select in text, audio, or video formats. The application uses **Flask** for the backend API and **React** for the frontend UI. 

The app supports multiple languages (English, Spanish, Japanese) and allows users to follow players, view player profiles, and manage their own preferences.

---

## Technologies Used
### Backend
- **Flask**: Micro web framework for Python.
- **PostgreSQL**: Relational database for storing user and player data.
- **JWT (JSON Web Tokens)**: For user authentication and authorization.
- **Flask-CORS**: To enable Cross-Origin Resource Sharing.
- **Flask-Bcrypt**: For password hashing and verification.

### API Requests
- **Axios**: For making HTTP requests to external APIs.
- **Google Cloud API**: For accessing MLB data through Google's cloud services and data feeds.
- **Cloud Translation API**: For translating webpages

### State Management
- **React Context API** (or **Redux**): For managing application state across components.

### Routing
- **React Router**: For navigating between pages in the React app.

---

## Features

- **User Authentication**: Sign up, log in, and JWT token-based authentication.
- **Player Management**: Add/remove MLB players to follow.
- **Personalized Highlights**: Get personalized content (text, audio, video) based on followed players.
- **Multi-Language Support**: English, Spanish, and Japanese.
- **Modern UI**: Built with React and Tailwind CSS for a responsive and attractive design.

---

## Google Cloud x MLB API Integration

This application uses data from the **Google Cloud x MLB** API, which provides live MLB game data and player statistics.

### MLB StatsAPI
To access live MLB data, the project integrates the **MLB StatsAPI**. Here's how to use it:

#### Example API Endpoints:
1. **Get Game Information:**
   ```bash
   https://statsapi.mlb.com/api/v1.1/game/{game_pk}/feed/live

For more information, visit: https://github.com/MajorLeagueBaseball/google-cloud-mlb-hackathon

---

## Prerequisites

Before running the project, ensure you have the following installed:

### For React (Frontend):
- **Node.js** (Recommended version: >=14.x)
- **npm** or **yarn** (Package managers)

### For Flask (Backend):
- **Python 3.x**
- **PostgreSQL** (or another preferred database)
- **pip** (for installing Python dependencies)

---

## Backend Setup (Flask)

1. Clone the repository to your local machine:
   ```bash
   git clone git@github.com:Rachel-XMR/MLB-StatHub.git
   cd Google-Cloud-x-MLB-Project/app
   
2. Install the required dependencies: 
   ```bash
   pip install -r requirements.txt

3. Run the Flask Application:
   ```python 
   python server.py
   
### Frontend Setup (React)

1. Navigate to the main directory
   ```bash
   cd Google-Cloud-x-MLB-Project
   
2. Install the required dependencies:
   ```bash
   npm install

3. Start the React development server: 
   ```bash
   npm start

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Future Work
- Deploying PostgreSQL & Flask backend to Render
- Integrating MLB content (footage & audio) with YouTube API and Vertex AI
