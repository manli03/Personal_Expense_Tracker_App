$(document).ready(function() {
    const expenseForm = $('#expense-form');
    const categories = [
        'Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Other Expenses'
    ];

    // Populate category select options
    const categorySelect = $('#category');
    categories.forEach(category => {
        categorySelect.append(new Option(category, category));
    });

    // Set the date input's max value to the current local date
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    $('#date').attr('max', localDate);

    // Add expense
    expenseForm.on('submit', function(e) {
        e.preventDefault();
        const amount = $('#amount').val();
        const date = $('#date').val();
        const category = $('#category').val();
        const description = $('#description').val();

        let users = JSON.parse(localStorage.getItem('users')) || [];
        let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
        const username = isLoggedIn.username;
        let user = users.find(u => u.username === username);
        let expenses = user.expenses || [];

        const expense = { amount, date, category, description };
        expenses.push(expense);
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));

        window.location.href = 'app.html';
    });

    // Back button click
    $('#backBtn').on('click', function() {
        window.location.href = 'app.html';
    });
});
