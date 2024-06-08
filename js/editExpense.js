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
    const expenseId = parseInt(localStorage.getItem('editExpenseId'), 10);
    const expenseMonth = parseInt(localStorage.getItem('editExpenseMonth'), 10);
    const expenseYear = parseInt(localStorage.getItem('editExpenseYear'), 10);
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    const username = isLoggedIn.username;
    let user = users.find(u => u.username === username);
    let expenses = user.expenses || {};
    const monthKey = `${expenseYear}-${expenseMonth}`;
    let monthExpenses = expenses[monthKey] || [];

    // Find the specific expense by id
    let expense = monthExpenses.find(exp => exp.id === expenseId);

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

        const updatedExpense = {
            id: expense.id, // Retain the same ID
            amount,
            date,
            category,
            description
        };

        // Update the expense in the expenses array
        const indexToUpdate = monthExpenses.findIndex(exp => exp.id === expense.id);
        if (indexToUpdate !== -1) {
            monthExpenses[indexToUpdate] = updatedExpense;
            expenses[monthKey] = monthExpenses;
            user.expenses = expenses;
            localStorage.setItem('users', JSON.stringify(users));
        }

        window.location.href = 'app.html';
    });

    // Delete expense
    $('#deleteExpenseBtn').on('click', function() {
        const indexToDelete = monthExpenses.findIndex(exp => exp.id === expense.id);

        if (indexToDelete !== -1) {
            monthExpenses.splice(indexToDelete, 1);
            expenses[monthKey] = monthExpenses;
            user.expenses = expenses;
            localStorage.setItem('users', JSON.stringify(users));
        }

        window.location.href = 'app.html';
    });

    // Back button click
    $('#backBtn').on('click', function() {
        window.location.href = 'app.html';
    });
});
