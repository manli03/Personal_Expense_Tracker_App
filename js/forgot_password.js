$(document).ready(function() {
    const forgotPasswordForm = $('#forgot-password-form');
    const message = $('#message');
    const successPopup = $('#successPopup');

    // Hide the success popup upon loading the page
    successPopup.hide();

    // Handle form submission
    forgotPasswordForm.on('submit', function(e) {
        e.preventDefault();
        
        // Retrieve form data
        const username = $('#username').val();
        const securityQuestion = $('#security-question').val();
        const securityAnswer = $('#security-answer').val();
        const newPassword = $('#new-password').val();

        // Validate form data
        if (!username || !securityQuestion || !securityAnswer || !newPassword) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        // Retrieve user data from local storage
        let users = JSON.parse(localStorage.getItem('users')) || [];
        let user = users.find(u => u.username === username);

        if (!user) {
            showMessage('User not found.', 'error');
            return;
        }

        // Check if security question and answer match
        if (user.securityQuestion !== securityQuestion || user.securityAnswer !== securityAnswer) {
            showMessage('Security question or answer is incorrect.', 'error');
            return;
        }

        // Update user's password
        user.password = newPassword;

        // Save updated user data to local storage
        localStorage.setItem('users', JSON.stringify(users));

        // Show success popup
        successPopup.show();

        // Reset form
        forgotPasswordForm.trigger('reset');
    });

    // Function to display messages
    function showMessage(messageText, className) {
        message.removeClass().addClass('text-center').addClass(className).text(messageText);
    }

    // Handle OK button click in the success popup
    successPopup.find('#okButton').on('click', function() {
        // Hide the popup
        successPopup.hide();
        // Redirect to the login page
        window.location.href = 'index.html';
    });
});
