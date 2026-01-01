$(document).ready(function () {
  const appContainer = $('#app-container');
  const expenseList = $('#expense-list');
  const totalAmount = $('#totalAmount');
  const monthsContainer = $('#monthsContainer');
  const pieChartContainer = $('#pieChartContainer');
  const ctx = document.getElementById('expensePieChart').getContext('2d');
  const categoryListContainer = $('#categoryListContainer');
  const monthNames = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
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
  let user = users.find((u) => u.username === username);
  if (!user) {
    user = { username: username, expenses: {} };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
  }
  let expenses = user.expenses || {};
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Populate months navigation
  function getMonthYearString(monthIndex, year) {
    if (year === currentYear) {
      return monthNames[monthIndex];
    }
    return `${monthNames[monthIndex]} ${year}`;
  }

  for (let i = 11; i >= 0; i--) {
    let monthIndex = (currentMonth - i + 12) % 12;
    let yearOffset = Math.floor((currentMonth - i) / 12);
    let year = currentYear + yearOffset;
    const monthString = getMonthYearString(monthIndex, year);

    const monthBtn = $('<button>')
      .addClass('btn month-btn')
      .html(`<span>${monthString}</span>`)
      .data('month', monthIndex)
      .data('year', year);

    if (i === 0) {
      monthBtn.addClass('active');
    }
    monthsContainer.append(monthBtn);
  }

  // Center the selected month button
  function centerMonthButton() {
    const activeBtn = $('.month-btn.active');
    if (activeBtn.length) {
      const containerWidth = monthsContainer.width();
      const buttonWidth = activeBtn.outerWidth(true);
      const scrollPosition =
        activeBtn.position().left +
        monthsContainer.scrollLeft() -
        (containerWidth / 2 - buttonWidth / 2);
      monthsContainer.animate({ scrollLeft: scrollPosition }, 300);
    }
  }

  // Populate categories
  const categories = [
    { name: 'Food', icon: 'fa-utensils', color: '#ff6384' },
    { name: 'Transport', icon: 'fa-bus', color: '#36a2eb' },
    { name: 'Utilities', icon: 'fa-bolt', color: '#ffce56' },
    { name: 'Health', icon: 'fa-heartbeat', color: '#4bc0c0' },
    { name: 'Entertainment', icon: 'fa-film', color: '#9966ff' },
    { name: 'Other Expenses', icon: 'fa-ellipsis-h', color: '#c9cbcf' },
  ];

  function populateCategoriesWithAmounts(categoryTotals) {
    categoryListContainer.empty();
    const sortedCategories = categories.sort(
      (a, b) => (categoryTotals[b.name] || 0) - (categoryTotals[a.name] || 0)
    );
    const budgets = getBudgetsForMonth();
    sortedCategories.forEach((category) => {
      const amount = categoryTotals[category.name] || 0;
      const budget = budgets[category.name] || 0;
      const budgetClass = budget > 0 && amount > budget ? 'over-budget' : '';
      const categoryItem = $(`
                <div class="category-item ${budgetClass}">
                    <div class="category-icon" style="background-color: ${
                      category.color
                    };">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-amount">RM ${amount.toFixed(2)}</span>
                    ${
                      budget > 0
                        ? `<span class="category-budget">Budget: RM ${budget.toFixed(
                            2
                          )}</span>`
                        : ''
                    }
                </div>
            `);
      categoryListContainer.append(categoryItem);
    });
  }

  function resetCategoriesToZero() {
    categoryListContainer.empty();
    categories.forEach((category) => {
      const categoryItem = $(`
                <div class="category-item">
                    <div class="category-icon" style="background-color: ${category.color};">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-amount">RM 0.00</span>
                </div>
            `);
      categoryListContainer.append(categoryItem);
    });
  }

  // Event listeners for month navigation
  $('#monthsContainer').on('click', '.month-btn', function () {
    $('.month-btn').removeClass('active');
    $(this).addClass('active');
    currentMonth = $(this).data('month');
    currentYear = $(this).data('year');
    centerMonthButton();
    displayExpenses();
  });

  $('#moneyInCard').click(function () {
    const monthKey = `${currentYear}-${currentMonth}`;

    let users = JSON.parse(localStorage.getItem('users')) || [];

    let isLoggedIn = JSON.parse(localStorage.getItem('isLoggedIn'));

    if (!isLoggedIn || !isLoggedIn.username) {
      Swal.fire({
        icon: 'error',
        title: 'Not Logged In',
        text: 'Please log in to update income.',
        confirmButtonColor: '#4CAF50',
      });
      return;
    }

    const username = isLoggedIn.username;

    let user = users.find((u) => u.username === username);
    let expenses = user.expenses || {};

    if (!expenses[monthKey]) {
      expenses[monthKey] = { income: 0, expenses: [] }; // Initialize with income and expenses
    }

    const currentIncome = expenses[monthKey]?.income;
    console.log(currentIncome);

    // Show the overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay';
    document.body.appendChild(overlay);

    Swal.fire({
      title: 'Update Income',
      input: 'number',
      inputLabel: 'Enter income amount',
      inputValue: currentIncome || '', // Set to empty if currentIncome is 0
      inputPlaceholder: currentIncome === 0 ? 'Enter your income' : '', // Placeholder when currentIncome is 0
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6c757d',
      backdrop: false, // Disable background dismiss
      inputValidator: (value) => {
        if (!value) return 'Please enter an amount!';
        if (value < 0) return 'Amount cannot be negative!';
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const incomeAmount = parseFloat(result.value);
        expenses[monthKey].income = incomeAmount;

        user.expenses = expenses;

        users = users.map((u) => (u.username === username ? user : u));
        localStorage.setItem('users', JSON.stringify(users));

        showSuccessPopup(incomeAmount);
      }
      // Remove the overlay when the modal is closed
      document.body.removeChild(overlay);
    });
  });

  function showSuccessPopup(incomeAmount) {
    Swal.fire({
      title: 'Success!',
      text: 'Your income has been updated to RM ' + incomeAmount,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#4CAF50',
    }).then(() => {
      // reload after user click Ok button
      location.reload();
    });
  }

  // Display expenses
  function displayExpenses() {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthData = expenses[monthKey] || { expenses: [] };
    const monthExpenses = monthData.expenses; // Access expenses array
    monthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort expenses by date, latest first

    expenseList.empty();
    let totalOut = 0;
    let categoryTotals = {};

    // Reset Money In and Balance
    const income = monthData.income !== undefined ? monthData.income : 0; // Load income value
    $('#moneyIn').text(`RM ${income.toFixed(2)}`);
    $('#balance').text('RM 0.00'); // Reset balance to 0 initially
    $('#balance').css('color', '#17a2b8'); // Reset color
    $('.balance').css('color', '#17a2b8'); // Positive balance

    if (monthExpenses.length === 0) {
      // Calculate balance even if there are no expenses
      const balance = income;
      $('#balance').text(`RM ${balance.toFixed(2)}`);
      totalAmount.html(`<span>RM 0.00</span>`);
      resetCategoriesToZero();
      hideChart();
      return;
    }

    monthExpenses.forEach((expense) => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += parseFloat(expense.amount);
      totalOut += parseFloat(expense.amount);
      expenseList.append(`
        <tr>
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.amount}</td>
            <td>${expense.description}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${expense.id}" data-month="${currentMonth}" data-year="${currentYear}">Edit</button>
            </td>
        </tr>
    `);
    });

    totalAmount.html(`<span>RM ${totalOut.toFixed(2)}</span>`);

    // Calculate balance
    const balance = income - totalOut;
    $('#balance').text(`RM ${balance.toFixed(2)}`);

    // Change balance text color based on value
    if (balance < 0) {
      $('#balance').css('color', 'red');
      $('.balance').css('color', 'red'); // Negative balance
    } else {
      $('#balance').css('color', '#17a2b8');
      $('.balance').css('color', '#17a2b8');
    }

    populateCategoriesWithAmounts(categoryTotals);
    displayChartFromCategoryList(categoryTotals, totalOut);
  }

  function hideChart() {
    if (myChart) {
      myChart.destroy();
      myChart = null;
    }
  }

  function displayChartFromCategoryList(categoryTotals, total) {
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(
      (label) => categories.find((cat) => cat.name === label).color
    );

    if (labels.length === 0) {
      hideChart();
      return;
    }

    pieChartContainer.show();

    if (!myChart) {
      myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: backgroundColors,
            },
          ],
        },
        options: {
          cutout: '70%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (tooltipItem, chartData) {
                  const totalValue = chartData.datasets[0].data.reduce(
                    (a, b) => a + b,
                    0
                  );
                  const currentValue =
                    chartData.datasets[0].data[tooltipItem.dataIndex];
                  const percentage = (
                    (currentValue / totalValue) *
                    100
                  ).toFixed(1);
                  return `${
                    chartData.labels[tooltipItem.dataIndex]
                  }: RM ${currentValue.toFixed(2)} (${percentage}%)`;
                },
              },
            },
            datalabels: {
              color: '#fff',
              display: (context) => context.dataset.data[context.dataIndex] > 0,
              formatter: (value, ctx) =>
                `${((value / total) * 100).toFixed(1)}%`,
              font: { weight: 'bold' },
              padding: 6,
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    } else {
      myChart.data.labels = labels;
      myChart.data.datasets[0].data = data;
      myChart.data.datasets[0].backgroundColor = backgroundColors;
      myChart.update();
    }
  }

  // Add expense button click
  $('#addExpenseBtn').on('click', function () {
    window.location.href = 'addExpense.html';
  });

  // Get budgets for the current month
  function getBudgetsForMonth() {
    const monthKey = `${currentYear}-${currentMonth}`;
    let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
    return budgets[monthKey] || {};
  }

  // Save budgets for the current month
  function saveBudgetsForMonth(budgets) {
    const monthKey = `${currentYear}-${currentMonth}`;
    let allBudgets = JSON.parse(localStorage.getItem('budgets')) || {};
    allBudgets[monthKey] = budgets;
    localStorage.setItem('budgets', JSON.stringify(allBudgets));
  }

  // Allocate budget button click
  $('#allocateBudgetBtn').on('click', function () {
    const currentBudgets = getBudgetsForMonth();
    let budgetHTML = '<div class="budget-allocation-form">';

    categories.forEach((category) => {
      const currentBudget = currentBudgets[category.name] || 0;
      budgetHTML += `
                <div class="budget-input-group">
                    <label for="budget-${category.name}">${
        category.name
      }</label>
                    <input type="number" id="budget-${
                      category.name
                    }" class="form-control budget-input" 
                           placeholder="Enter budget (RM)" value="${
                             currentBudget > 0 ? currentBudget : ''
                           }" min="0" step="0.01">
                </div>
            `;
    });

    budgetHTML += '</div>';

    // Show the overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay';
    document.body.appendChild(overlay);

    Swal.fire({
      title: 'Allocate Budget for ' + monthNames[currentMonth],
      html: budgetHTML,
      showCancelButton: true,
      confirmButtonText: 'Save Budgets',
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6c757d',
      backdrop: false,
      didOpen: function () {
        // Style the form after it's opened
        const form = document.querySelector('.budget-allocation-form');
        if (form) {
          form.style.maxHeight = '400px';
          form.style.overflowY = 'auto';
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newBudgets = {};
        categories.forEach((category) => {
          const inputValue = $(`#budget-${category.name}`).val();
          if (inputValue && inputValue > 0) {
            newBudgets[category.name] = parseFloat(inputValue);
          }
        });

        saveBudgetsForMonth(newBudgets);

        Swal.fire({
          title: 'Success!',
          text: 'Budget allocation has been saved.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#4CAF50',
        }).then(() => {
          location.reload();
        });
      }
      // Remove the overlay when the modal is closed
      document.body.removeChild(overlay);
    });
  });

  // Add expense button click

  // Edit expense button click
  expenseList.on('click', '.edit-btn', function () {
    const id = $(this).data('id');
    const month = $(this).data('month');
    const year = $(this).data('year');
    localStorage.setItem('editExpenseId', id);
    localStorage.setItem('editExpenseMonth', month);
    localStorage.setItem('editExpenseYear', year);
    window.location.href = 'editExpense.html';
  });

  // Logout functionality
  $('#logoutBtn').on('click', function () {
    isLoggedIn = false;
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    window.location.href = 'index.html';
  });

  // Initial display
  centerMonthButton(); // Center the current month button on initial load
  displayExpenses();
});
