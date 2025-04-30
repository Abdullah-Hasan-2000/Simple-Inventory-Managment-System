// This script checks if the user is logged in.
// If not, it redirects to the login page (index.html).

firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
        // User is not signed in.
        console.log('User not logged in, redirecting to login page.');
        // Redirect to the login page (adjust path if necessary)
        window.location.href = '../index.html'; 
    } else {
        // User is signed in.
        console.log('User is logged in:', user.email);
        // You can optionally display user info or enable page features here
    }
});

// Log Out Function (moved here for accessibility on protected pages)
function logOut() {
    firebase.auth().signOut()
        .then(function() {
            // Sign-out successful.
            console.log('Logged out');
            // Redirect to login page after logout
            window.location.href = '../index.html'; 
        })
        .catch(function(error) {
            // An error happened.
            console.error('Log out error:', error);
            // Optionally display an error message to the user
        });
}
