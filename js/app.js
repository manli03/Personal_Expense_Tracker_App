// app.js
$(document).ready(function() {
    const appContainer = $('#app-container');
    const expenseForm = $('#expense-form');
    const expenseList = $('#expense-list');
    const totalExpenses = $('#total-expenses');
    const ctx = document.getElementById('expenseChart').getContext('2d');
    // Declare myChart as a global variable
    let myChart;

    // Check if user is logged in
    let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));
    if (!isLoggedIn) {
        window.location.href = 'index.html';
    } else {
        appContainer.removeClass('d-none');
    }

    const username = isLoggedIn.username;

    // Load user expenses from Local Storage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let user = users.find(u => u.username === username);
    let expenses = user.expenses || [];

    // Display expenses on load
    displayExpenses();

    // Add expense
    expenseForm.on('submit', function(e) {
        e.preventDefault();
        const amount = $('#amount').val();
        const date = $('#date').val();
        const description = $('#description').val();

        const expense = { amount, date, description };
        expenses.push(expense);

        // Update user expenses in Local Storage
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        displayExpenses();
        expenseForm.trigger('reset');
    });

    // Display expenses
    function displayExpenses() {
        expenseList.empty();
        let total = 0;

        // Sort expenses by date
        expenses.sort((a, b) => new Date(a.date) - new Date(b.date));

        expenses.forEach((expense, index) => {
            total += parseFloat(expense.amount);
            expenseList.append(`
                <tr>
                    <td>${expense.amount}</td>
                    <td>${expense.date}</td>
                    <td>${expense.description}</td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-btn" data-index="${index}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">Delete</button>
                    </td>
                </tr>
            `);
        });
        totalExpenses.text(total.toFixed(2));
        displayChart();
    }

    // Delete expense
    expenseList.on('click', '.delete-btn', function() {
        const index = $(this).data('index');
        expenses.splice(index, 1);

        // Update user expenses in Local Storage
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        displayExpenses();
    });

    // Edit expense
    expenseList.on('click', '.edit-btn', function() {
        const index = $(this).data('index');
        const expense = expenses[index];
        $('#amount').val(expense.amount);
        $('#date').val(expense.date);
        $('#description').val(expense.description);
        expenses.splice(index, 1);

        // Update user expenses in Local Storage
        user.expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        displayExpenses();
    });

    // Function to display the chart
    function displayChart() {
        const dates = expenses.map(expense => expense.date);
        const amounts = expenses.map(expense => parseFloat(expense.amount));
      
        if (!myChart) {
          myChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: dates,
              datasets: [{
                label: 'Expenses',
                data: amounts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        } else {
          myChart.data.labels = dates;
          myChart.data.datasets[0].data = amounts;
          myChart.update();
        }
      }

    // Logout functionality
    $('#logoutBtn').on('click', function() {
        isLoggedIn = false; // Set isLoggedIn to false
        localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
        window.location.href = 'index.html'; // Redirect to the login page
    });

    // Clear local storage when a button with id "clearStorageBtn" is clicked
    $('#clearStorageBtn').on('click', function() {
        localStorage.clear();
        // Optionally, you can also redirect the user to a specific page after clearing the storage
        // window.location.href = 'index.html';
    });
});