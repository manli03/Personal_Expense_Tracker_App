// signup.js

$(document).ready(function() {
    const signupForm = $('#signup-form');
    const messageContainer = $('#message');
    const signupSuccessPopup = $('#signupSuccessPopup');

    // Clear the signup success state upon loading the signup page
    signupSuccessPopup.hide();

    signupForm.on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();
        const securityQuestion = $('#security-question').val(); // Retrieve selected security question
        const securityAnswer = $('#security-answer').val(); // Retrieve security answer

        // Retrieve users from localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];

        // Check if username already exists
        const userExists = users.some(u => u.username === username);

        if (userExists) {
            showMessage('Username already exists. Please choose another.', 'error');
        } else {
            users.push({ username, password, securityQuestion, securityAnswer }); // Store security question and answer along with username and password
            localStorage.setItem('users', JSON.stringify(users));
            signupSuccessPopup.show();
        }
    });

    function showMessage(message, type) {
        messageContainer.removeClass('success error').addClass(type).text(message).slideDown();
        setTimeout(() => {
            messageContainer.slideUp();
        }, 5000);
    }

    // Handle OK button click in the signup success popup
    signupSuccessPopup.find('#okButton').on('click', function() {
        // Hide the popup
        signupSuccessPopup.hide();
        // Redirect to the login page
        window.location.href = 'index.html';
    });
});
