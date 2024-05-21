$(document).ready(function() {
    const loginContainer = $('#login-container');
    const appContainer = $('#app-container');
    const loginForm = $('#login-form');
    const expenseForm = $('#expense-form');
    const expenseList = $('#expense-list');
    const totalExpenses = $('#total-expenses');
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        loginContainer.hide();
        appContainer.removeClass('d-none');
    }

    loginForm.on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        console.log('Login form submitted');
        console.log('Username:', username, 'Password:', password);

        // Simple validation
        if (username === 'user' && password === 'pass') {
            localStorage.setItem('isLoggedIn', true);
            loginContainer.hide();
            appContainer.removeClass('d-none');
        } else {
            alert('Invalid credentials');
        }
    });

    // Load expenses from Local Storage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

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
        localStorage.setItem('expenses', JSON.stringify(expenses));
        displayExpenses();
        expenseForm.trigger('reset');
    });

    // Display expenses
    function displayExpenses() {
        expenseList.empty();
        let total = 0;
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
        localStorage.setItem('expenses', JSON.stringify(expenses));
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
        localStorage.setItem('expenses', JSON.stringify(expenses));
        displayExpenses();
    });

    // Function to display the chart
    function displayChart() {
        const dates = expenses.map(expense => expense.date);
        const amounts = expenses.map(expense => parseFloat(expense.amount));

        new Chart(ctx, {
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
    }
});
