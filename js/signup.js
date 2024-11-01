// signup.js

$(document).ready(function() {
    const signupForm = $('#signup-form');
    const messageContainer = $('#message');

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
            showSuccessPopup(); // Show success popup
        }
    });

    function showMessage(message, type) {
        messageContainer.removeClass('success error').addClass(type).text(message).slideDown();
        setTimeout(() => {
            messageContainer.slideUp();
        }, 5000);
    }

    function showSuccessPopup() {
        Swal.fire({
            title: 'Success!',
            text: 'Your account has been created successfully!',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50'
        }).then(() => {
            // Redirect to the login page after clicking OK
            window.location.href = 'index.html';
        });
    }
});
