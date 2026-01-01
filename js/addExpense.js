$(document).ready(function() {
  const expenseForm = $('#expense-form');

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
  const categorySelect = $('#category');
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
  $('#date').attr('max', localDate);

  // Add expense
  expenseForm.on('submit', function (e) {
    e.preventDefault();
    const amount = $('#amount').val();
    const date = $('#date').val();
    const category = $('#category').val();
    const description = $('#description').val();

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    const username = isLoggedIn.username;
    let user = users.find((u) => u.username === username);

    // If user does not exist, create a new user
    if (!user) {
      user = { username: username, expenses: {} };
      users.push(user);
    }

    let expenses = user.expenses || {};

    // Generate a unique ID for the expense
    const expense = {
      id: Date.now(), // Using timestamp as a simple unique ID
      amount: parseFloat(amount), // Ensure amount is stored as a number
      date,
      category,
      description,
    };

    // Determine the key for the current month
    const expenseDate = new Date(date);
    const monthKey = `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`;

    // Initialize the month's expenses if it doesn't exist
    if (!expenses[monthKey]) {
      expenses[monthKey] = { income: 0, expenses: [] }; // Initialize with income and expenses array
    }

    // Save the new expense to the appropriate month
    expenses[monthKey].expenses.push(expense); // Add expense to the expenses array

    user.expenses = expenses;
    localStorage.setItem('users', JSON.stringify(users)); // Save updated user information

    window.location.href = 'app.html';
  });

  // Back button click
  $('#backBtn').on('click', function () {
    window.location.href = 'app.html';
  });
});
