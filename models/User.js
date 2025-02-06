// routes/reviewRoutes.js
const express = require('express');
const User = require('../models/User');
const Movie = require('../models/Movie');
const router = express.Router();

// Add a review for a movie
router.post('/submit-review', async (req, res) => {
  const { userId, movieId, reviewText } = req.body;

  try {
    const movie = await Movie.findById(movieId);
    const user = await User.findById(userId);

    if (!movie || !user) {
      return res.status(404).json({ message: 'Movie or User not found' });
    }

    // Add the review to the user's reviews array
    user.reviews.push({
      movieId: movie._id,
      movieTitle: movie.title,
      reviewText: reviewText
    });

    // Add the movie to the user's collection if not already there
    const alreadyInCollection = user.collection.find(item => item.movieId === movieId);
    if (!alreadyInCollection) {
      user.collection.push({
        movieId: movie._id,
        movieTitle: movie.title
      });
    }

    await user.save();
    res.status(200).json({ message: 'Review submitted and movie added to collection' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting review', error });
  }
});

module.exports = router;
