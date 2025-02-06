// Check authentication status and dynamically update the navigation bar
window.onload = () => {
  const token = localStorage.getItem('token');
  const authLink = document.getElementById('auth-link');
  const logoutButton = document.getElementById('logout-button');

  if (token) {
    // User is logged in
    authLink.style.display = 'none';
    logoutButton.style.display = 'inline-block';
  } else {
    // User is not logged in
    authLink.style.display = 'inline-block';
    logoutButton.style.display = 'none';
  }

  // Logout functionality
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token'); // Remove token
    alert('You have logged out.');
    window.location.href = '/'; // Redirect to homepage
  });

  if (window.location.pathname === '/') {
    loadMovies();

    // Handle search functionality on homepage
    document.getElementById('search-button').addEventListener('click', function () {
      const query = document.getElementById('search-input').value;
      if (query) {
        searchMovies(query);
      }
    });
  }

  if(window.location.pathname === '/login.html'){
    document.getElementById('loginForm').addEventListener('submit', function (event) {
      event.preventDefault();
    
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
    
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.token) {
            localStorage.setItem('token', data.token); // Store the token
            alert('Login successful!');
            window.location.href = '/'; // Redirect to homepage
          } else {
            alert(data.message);
          }
        })
        .catch(error => console.error('Error logging in user:', error));
    });
  }

  if (window.location.pathname === '/user-collection.html') {
    loadUserCollection();

    // Handle search functionality on user collection page
    document.getElementById('collection-search-button').addEventListener('click', function () {
      const query = document.getElementById('collection-search-input').value;
      if (query) {
        searchInCollection(query);
      }
    });
  }

  if (window.location.pathname === '/movie-details.html') {
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    fetchMovieDetails(movieId);

    // Handle user review submission
    document.addEventListener('submit', function (event) {
      event.preventDefault();
      const reviewText = document.getElementById('reviewText').value;
      const token = localStorage.getItem('token'); // Get the token from localStorage

      if (!token) {
        alert('You must be logged in to submit a review.');
        return;
      }

      fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Include the token
        },
        body: JSON.stringify({
          movieId,
          movieTitle: document.querySelector('h2').textContent,
          reviewText,
        }),
      })
        .then(response => {
          if (response.status === 401) {
            alert('Unauthorized: Please log in again.');
            window.location.href = '/login.html';
            return;
          }
          return response.json();
        })
        .then(data => {
          alert(data.message || 'Review submitted successfully!');
          loadUserReviews(movieId); // Reload reviews
        })
        .catch(error => console.error('Error saving review:', error));

      document.getElementById('reviewText').value = ''; // Clear input
    });

  }
};

// Load popular movies on the homepage
function loadMovies() {
  fetch('/api/movies')
    .then(response => response.json())
    .then(movies => {
      displayMovies(movies);
    })
    .catch(error => console.error('Error fetching movies:', error));
}

// Search for movies using the TMDB API
function searchMovies(query) {
  fetch(`/api/search-movies?query=${query}`)
    .then(response => response.json())
    .then(movies => {
      displayMovies(movies);
    })
    .catch(error => console.error('Error searching for movies:', error));
}

// Display movies in the list
function displayMovies(movies) {
  const moviesList = document.getElementById('movies-list');
  moviesList.innerHTML = ''; // Clear previous content
  movies.forEach(movie => {
    const movieItem = document.createElement('div');
    movieItem.classList.add('movie-item');
    movieItem.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
      <h2>${movie.title}</h2>
      <p>${movie.overview}</p>
      <a href="/movie-details.html?id=${movie.id}">Read More</a>
    `;
    moviesList.appendChild(movieItem);
  });
}

// Load user's movie collection
function loadUserCollection() {
  const token = localStorage.getItem('token'); // Get the token
  if (!token) {
    alert('You must be logged in to view your collection.');
    window.location.href = '/login.html';
    return;
  }

  fetch('/api/user-collection', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`, // Include the token
    },
  })
    .then(response => {
      if (response.status === 401) {
        alert('Unauthorized: Please log in again.');
        window.location.href = '/login.html';
        return;
      }
      return response.json();
    })
    .then(data => {
      if (data?.collection) {
        displayUserCollection(data.collection);
      } else {
        alert('No collection found.');
      }
    })
    .catch(error => console.error('Error loading collection:', error));
}


// Search within the user's collection
function searchInCollection(query) {
  const userId = localStorage.getItem('token'); // Replace with dynamic userId if needed
  fetch(`/api/user-collection/${userId}`)
    .then(response => response.json())
    .then(data => {
      const filteredMovies = data.collection.filter(movie =>
        movie.movieTitle.toLowerCase().includes(query.toLowerCase())
      );
      displayUserCollection(filteredMovies);
    })
    .catch(error => console.error('Error searching in collection:', error));
}

// Display the user's movie collection
function displayUserCollection(movies) {
  const collectionList = document.getElementById('user-collection');
  collectionList.innerHTML = ''; // Clear previous content
  movies.forEach(movie => {
    const movieItem = document.createElement('div');
    movieItem.classList.add('movie-item');
    movieItem.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.posterPath}" alt="${movie.movieTitle} Poster">
      <h2>${movie.movieTitle}</h2>
      <p>Release Date: ${movie.releaseDate}</p>
      <a href="/movie-details.html?id=${movie.movieId}">View Details</a>
    `;
    collectionList.appendChild(movieItem);
  });
}

// Fetch and display movie details
function fetchMovieDetails(movieId) {
  fetch(`/api/movies/${movieId}`)
    .then(response => response.json())
    .then(movie => {
      const movieDetails = document.getElementById('movie-details');
      const addToCollectionButton = document.getElementById('add-to-collection-button');

      movieDetails.innerHTML = `
        <img style="margin:auto;width:40%;height=40%" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title} Poster">
        <h2>${movie.title}</h2>
        <p>${movie.overview}</p>
        <p>Release Date: ${movie.release_date}</p>
        <h3>Add Your Review:</h3>
        <ul id="user-reviews-list"></ul>
        <form id="reviewForm">
          <textarea id="reviewText" placeholder="Write your review here..." required></textarea>
          <button type="submit">Submit Review</button>
        </form>
      `;

      // Display the "Add to My Collection" button
      addToCollectionButton.style.display = 'block';

      // Add event listener for adding the movie to the user's collection
      addToCollectionButton.addEventListener('click', () => {
        addToUserCollection(movie);
      });

      loadUserReviews(movieId);
    })
    .catch(error => console.error('Error fetching movie details:', error));
}

//add to user's collection
function addToUserCollection(movie) {
  const token = localStorage.getItem('token'); // Retrieve the token

  if (!token) {
    alert('You must be logged in to add a movie to your collection.');
    return;
  }

  fetch('/api/user-collection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Include the token in the request header
    },
    body: JSON.stringify({
      movieId: movie.id,
      movieTitle: movie.title,
      posterPath: movie.poster_path,
      overview: movie.overview,
      releaseDate: movie.release_date,
    }),
  })
    .then(response => {
      if (response.status === 401) {
        alert('Unauthorized: Please log in again.');
        window.location.href = '/login.html';
        return;
      }
      return response.json();
    })
    .then(data => {
      if (data?.message) {
        alert(data.message);
      } else {
        alert('Movie added to your collection!');
      }
    })
    .catch(error => console.error('Error adding movie to collection:', error));
}

// Fetch and display reviews for a movie
function loadUserReviews(movieId) {
  fetch(`/api/reviews/${movieId}`)
    .then(response => response.json())
    .then(reviews => {
      const userReviewsList = document.getElementById('user-reviews-list');
      userReviewsList.innerHTML = ''; // Clear previous reviews
      if (reviews.length > 0) {
        reviews.forEach(review => {
          const reviewItem = document.createElement('li');
          reviewItem.textContent = `${review.reviewText} (Posted on ${new Date(
            review.createdAt
          ).toLocaleDateString()})`;
          userReviewsList.appendChild(reviewItem);
        });
      } else {
        userReviewsList.innerHTML = '<li>No reviews yet. Be the first to review!</li>';
      }
    })
    .catch(error => console.error('Error fetching reviews:', error));
}
