# myMovieList Project

This project is a movie review platform where users can search for movies, add reviews, and maintain their personal movie collection. It is built using Node.js, Express, MongoDB, and the TMDB API.

## Features
- Search movies by title using the TMDB API.
- View popular movies and movie details.
- Register and log in with JWT-based authentication.
- Add movies to the user’s collection.
- Post and view user-generated reviews.
- Persistent storage using MongoDB.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **API Integration**: TMDB API

## Installation Instructions
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/moviesreview.git
   cd moviesreview
2. **Install dependencies:**
    npm install
3. **Setup environment variables:**
    Create a .env file in the root directory using the provided .env.example as a reference.
    Fill in the required values, such as your TMDB API key and MongoDB connection URI.
4. **Run the project:**
    npm start
