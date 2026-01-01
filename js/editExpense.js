$(document).ready(function() {
  const expenseForm = $('#edit-expense-form');

  // Default categories
  const defaultCategories = [
    { name: 'Food', icon: 'fa-utensils', color: '#ff6384' },
    { name: 'Transport', icon: 'fa-bus', color: '#36a2eb' },
    { name: 'Utilities', icon: 'fa-bolt', color: '#ffce56' },
    { name: 'Health', icon: 'fa-heartbeat', color: '#4bc0c0' },
    { name: 'Entertainment', icon: 'fa-film', color: '#9966ff' },
    { name: 'Other Expenses', icon: 'fa-ellipsis-h', color: '#c9cbcf' },
  ];

  // Load categories from localStorage or use defaults
  let categories =
    JSON.parse(localStorage.getItem('userCategories')) || defaultCategories;

  // Populate category select options
  const categorySelect = $('#edit-category');
  categories.forEach((category) => {
    const categoryName =
      typeof category === 'string' ? category : category.name;
    categorySelect.append(new Option(categoryName, categoryName));
  });

  // Set the date input's max value to the current local date
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split('T')[0];
  $('#edit-date').attr('max', localDate);

  // Load expense data
  const expenseId = parseInt(localStorage.getItem('editExpenseId'), 10);
  const expenseMonth = parseInt(localStorage.getItem('editExpenseMonth'), 10);
  const expenseYear = parseInt(localStorage.getItem('editExpenseYear'), 10);
  let users = JSON.parse(localStorage.getItem('users')) || [];
  let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
  const username = isLoggedIn.username;
  let user = users.find((u) => u.username === username);
  let expenses = user.expenses || {};
  const monthKey = `${expenseYear}-${expenseMonth}`;
  let monthData = expenses[monthKey] || { income: 0, expenses: [] };
  let monthExpenses = monthData.expenses;

  // Find the specific expense by id
  let expense = monthExpenses.find((exp) => exp.id === expenseId);

  if (expense) {
    $('#edit-amount').val(expense.amount);
    $('#edit-date').val(expense.date);
    $('#edit-category').val(expense.category);
    $('#edit-description').val(expense.description);
  }

  // Update expense
  expenseForm.on('submit', function (e) {
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
      description,
    };

    // Update the expense in the expenses array
    const indexToUpdate = monthExpenses.findIndex(
      (exp) => exp.id === expense.id
    );
    if (indexToUpdate !== -1) {
      monthExpenses[indexToUpdate] = updatedExpense; // Update the specific expense
      monthData.expenses = monthExpenses; // Update the expenses array in monthData
      expenses[monthKey] = monthData; // Save updated monthData
      user.expenses = expenses; // Update user expenses
      localStorage.setItem('users', JSON.stringify(users)); // Save updated users information
    }

    window.location.href = 'app.html';
  });

  // Delete expense
  $('#deleteExpenseBtn').on('click', function () {
    const indexToDelete = monthExpenses.findIndex(
      (exp) => exp.id === expense.id
    );

    if (indexToDelete !== -1) {
      monthExpenses.splice(indexToDelete, 1); // Delete specific expense for that month
      monthData.expenses = monthExpenses; // Update the expenses array in monthData
      expenses[monthKey] = monthData; // Save updated monthData
      user.expenses = expenses; // Update user expenses
      localStorage.setItem('users', JSON.stringify(users)); // Save updated users information
    }

    window.location.href = 'app.html';
  });

  // Back button click
  $('#backBtn').on('click', function () {
    window.location.href = 'app.html';
  });
});
