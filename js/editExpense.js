$(document).ready(function() {
    const expenseForm = $('#edit-expense-form');
    const categories = [
        'Food', 'Transport', 'Utilities', 'Health', 'Entertainment', 'Other Expenses'
    ];

    // Populate category select options
    const categorySelect = $('#edit-category');
    categories.forEach(category => {
        categorySelect.append(new Option(category, category));
    });

    // Set the date input's max value to the current local date
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    $('#edit-date').attr('max', localDate);

    // Load expense data
    const expenseIndex = localStorage.getItem('editExpenseIndex');
    const expenseMonth = localStorage.getItem('editExpenseMonth');
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    const username = isLoggedIn.username;
    let user = users.find(u => u.username === username);
    let expenses = user.expenses || [];

    const expense = expenses.find((exp, index) => new Date(exp.date).getMonth() == expenseMonth && index == expenseIndex);

    if (expense) {
        $('#edit-amount').val(expense.amount);
        $('#edit-date').val(expense.date);
        $('#edit-category').val(expense.category);
        $('#edit-description').val(expense.description);
    }

    // Update expense
    expenseForm.on('submit', function(e) {
        e.preventDefault();
        const amount = $('#edit-amount').val();
        const date = $('#edit-date').val();
        const category = $('#edit-category').val();
        const description = $('#edit-description').val();

        const updatedExpense = { amount, date, category, description };

        // Update the expense in the expenses array
        expenses[expenseIndex] = updatedExpense;
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));

        window.location.href = 'app.html';
    });

    // Delete expense
    $('#deleteExpenseBtn').on('click', function() {
        expenses.splice(expenseIndex, 1);
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        window.location.href = 'app.html';
    });

    // Back button click
    $('#backBtn').on('click', function() {
        window.location.href = 'app.html';
    });
});
