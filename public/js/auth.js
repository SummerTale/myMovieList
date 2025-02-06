// Handle Registration
document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();
  
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
  
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
      .then(response => response.json())
      .then(data => alert(data.message))
      .catch(error => console.error('Error registering user:', error));
  });
  
  // Handle Login
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
  