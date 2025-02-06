const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const mongoURI = process.env.MONGO_URI;
const apiKey = process.env.TMDB_API_KEY;
const jwtSecret = process.env.JWT_SECRET;

// MongoDB setup
const dbName = 'movieList';
let db;

// Connect to MongoDB
MongoClient.connect(mongoURI)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve HTML files from the views folder
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/movie-details.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'movie-details.html')));
app.get('/user-collection.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'user-collection.html')));


// Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log('Authorization Header:', authHeader); // Debug log

  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('No token provided.');
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  });
}


// Logout endpoint (optional placeholder)
app.post('/api/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' });
});

function authenticateToken(req, res, next) {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required.' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Register a user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required' });

  try {
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username, email, password: hashedPassword, createdAt: new Date() });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields are required' });

  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, jwtSecret, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});


// Fetch popular movies from TMDB
app.get('/api/movies', async (req, res) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular`, {
      params: { api_key: apiKey, language: 'en-US', page: 1 },
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
});

// Search movies in TMDB
app.get('/api/search-movies', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Query parameter is required' });

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: { api_key: apiKey, query, language: 'en-US' },
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Error searching for movies:', error);
    res.status(500).json({ message: 'Error searching for movies' });
  }
});

// Fetch details of a single movie from TMDB
app.get('/api/movies/:id', async (req, res) => {
  const movieId = req.params.id;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: { api_key: apiKey, language: 'en-US' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ message: 'Error fetching movie details' });
  }
});

// Add a movie to the user's collection
app.post('/api/user-collection', authenticateToken, async (req, res) => {
  const { userId } = req.user; // Extracted from the JWT token
  const { movieId, movieTitle, posterPath, overview, releaseDate } = req.body;

  if (!movieId || !movieTitle) return res.status(400).json({ message: 'Movie ID and title are required' });

  try {
    const collection = db.collection('userCollections');
    const existingMovie = await collection.findOne({ userId, movieId });

    if (existingMovie) return res.status(400).json({ message: 'Movie already in your collection' });

    await collection.insertOne({ userId, movieId, movieTitle, posterPath, overview, releaseDate, addedAt: new Date() });
    res.status(201).json({ message: 'Movie added to your collection' });
  } catch (error) {
    console.error('Error adding movie to collection:', error);
    res.status(500).json({ message: 'Error adding movie to collection' });
  }
});

// Fetch user's movie collection
app.get('/api/user-collection', authenticateToken, async (req, res) => {
  const { userId } = req.user; // Extracted from the JWT token

  try {
    const collection = db.collection('userCollections');
    const userCollection = await collection.find({ userId }).toArray();
    res.json({ collection: userCollection });
  } catch (error) {
    console.error('Error fetching user collection:', error);
    res.status(500).json({ message: 'Error fetching user collection' });
  }
});


// Add a user review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  const { movieId, movieTitle, reviewText } = req.body;
  const { userId } = req.user;

  if (!movieId || !reviewText) return res.status(400).json({ message: 'Movie ID and review text are required' });

  try {
    const reviewsCollection = db.collection('reviews');
    await reviewsCollection.insertOne({ userId, movieId, movieTitle, reviewText, createdAt: new Date() });
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Error adding review' });
  }
});

// Fetch reviews for a movie
app.get('/api/reviews/:movieId', async (req, res) => {
  const { movieId } = req.params;

  try {
    const reviewsCollection = db.collection('reviews');
    const reviews = await reviewsCollection.find({ movieId }).toArray();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

app.get('/api/debug-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
