
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
    authErrorDiv.textContent = '';

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            
            var user = userCredential.user;
            console.log('Logged in:', user.email);
            authStatusDiv.textContent = 'Logged in as ' + user.email;
           
            window.location.href = 'dashboard/dashboard.html'; 
        })
        .catch(function(error) {
            
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
            
            console.log('Logged out');
            authStatusDiv.textContent = 'You have been logged out.';
        })
        .catch(function(error) {
           
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
        logoutButton.style.display = 'block';

        
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
             
        }

    } else {
        // User is signed out.
        console.log('Auth state changed: Logged out');
        authStatusDiv.textContent = 'Please log in';
        logoutButton.style.display = 'none';
    }
});