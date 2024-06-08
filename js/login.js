// login.js
$(document).ready(function() {
    const loginForm = $('#login-form');
    const messageContainer = $('#message');
    const successPopup = $('#successPopup');

    const defaultUsers = [
        { username: 'admin', password: 'secure_password' }, // Default user
    ];

    loginForm.on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
    
        // Retrieve users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || defaultUsers; // Use default if no users exist
    
        const user = users.find(u => u.username === username);
        
        if (user) {
            if (user.password === password) {
                localStorage.setItem('isLoggedIn', JSON.stringify({ username }));
                successPopup.show();
            } else {
                showMessage('Invalid credentials. Please try again.', 'error');
            }
        } else {
            showMessage('User not exist. Please sign up first.', 'error');
        }
    });
    

    $('#okButton').on('click', function() {
        window.location.href = 'app.html';
        successPopup.hide();
    });

    function showMessage(message, type) {
        messageContainer.removeClass('success error').addClass(type).text(message).slideDown();
        setTimeout(() => {
            messageContainer.slideUp();
        }, 5000);
    }

    // Check if user is already logged in
    const isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    if (isLoggedIn) {
        window.location.href = 'app.html';
    } else {
        // Hide success popup if the user is not logged in
        successPopup.hide();
    }
});
