// Get references to UI elements
var emailInput = document.getElementById('email');
var passwordInput = document.getElementById('password');
var authStatusDiv = document.getElementById('auth-status');
var authErrorDiv = document.getElementById('auth-error');
var logoutButton = document.getElementById('logoutButton');

// --- Authentication Functions ---

// Log In
function logIn() {
    var email = emailInput.value;
    var password = passwordInput.value;
    authErrorDiv.textContent = ''; // Clear previous errors

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            // Signed in successfully
            var user = userCredential.user;
            console.log('Logged in:', user.email);
            authStatusDiv.textContent = 'Logged in as ' + user.email;
            // Redirect to dashboard after successful login
            window.location.href = 'dashboard/dashboard.html'; 
        })
        .catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.error('Log in error:', errorCode, errorMessage);
            authErrorDiv.textContent = 'Error: ' + errorMessage;
        });
}

// Log Out
function logOut() {
    firebase.auth().signOut()
        .then(function() {
            // Sign-out successful.
            console.log('Logged out');
            authStatusDiv.textContent = 'You have been logged out.';
        })
        .catch(function(error) {
            // An error happened.
            console.error('Log out error:', error);
            authErrorDiv.textContent = 'Error logging out: ' + error.message;
        });
}

// --- Auth State Listener ---

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        console.log('Auth state changed: Logged in as', user.email);
        authStatusDiv.textContent = 'Logged in as ' + user.email;
        logoutButton.style.display = 'block'; // Show logout button
        // Hide login/signup buttons if desired
        // document.querySelector('button[onclick="signUp()"]').style.display = 'none';
        // document.querySelector('button[onclick="logIn()"]').style.display = 'none';

        // If user is already logged in and on the index page, redirect them
        // Check current page to prevent redirect loop if already on dashboard
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
             // Uncomment the line below if you want automatic redirect on page load when logged in
             // window.location.href = 'dashboard/dashboard.html';
        }

    } else {
        // User is signed out.
        console.log('Auth state changed: Logged out');
        authStatusDiv.textContent = 'Please log in';
        logoutButton.style.display = 'none'; // Hide logout button
         // Show login/signup buttons if they were hidden
        // document.querySelector('button[onclick="signUp()"]').style.display = 'inline-block';
        // document.querySelector('button[onclick="logIn()"]').style.display = 'inline-block';
    }
});