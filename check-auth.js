// This code checks if the user is logged in.
// If not, it redirects to the login page (index.html).

firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {

        console.log('User not logged in, redirecting to login page.');

        window.location.href = '../index.html';
    } else {

        console.log('User is logged in:', user.email);

    }
});

// Log Out Function
function logOut() {
    firebase.auth().signOut()
        .then(function () {

            console.log('Logged out');

            window.location.href = '../index.html';
        })
        .catch(function (error) {

            console.error('Log out error:', error);

        });
}
