const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  genre: [String],
  releaseDate: Date,
  director: String,
  cast: [String],
  reviews: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      reviewText: String,
      rating: Number,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model('Movie', MovieSchema);
