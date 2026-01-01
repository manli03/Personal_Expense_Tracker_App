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

  function populateCategoriesWithAmounts(categoryTotals) {
    categoryListContainer.empty();
    // Separate "Other Expenses" from other categories
    const otherExpensesCategory = categories.find(
      (cat) => cat.name === 'Other Expenses'
    );
    const otherCategories = categories.filter(
      (cat) => cat.name !== 'Other Expenses'
    );

    // Sort other categories by amount (descending)
    const sortedCategories = otherCategories.sort(
      (a, b) => (categoryTotals[b.name] || 0) - (categoryTotals[a.name] || 0)
    );

    // Add "Other Expenses" at the end if it exists
    if (otherExpensesCategory) {
      sortedCategories.push(otherExpensesCategory);
    }

    const budgets = getBudgetsForMonth();
    sortedCategories.forEach((category) => {
      const amount = categoryTotals[category.name] || 0;
      const budget = budgets[category.name] || 0;
      const isOverBudget = budget > 0 && amount > budget;
      const budgetClass = isOverBudget ? 'over-budget' : '';
      const categoryItem = $(`
                <div class="category-item">
                    <div class="category-icon" style="background-color: ${
                      category.color
                    };">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name">${category.name}</span>
                    ${
                      budget > 0
                        ? `<span class="category-budget ${budgetClass}">Budget: RM ${budget.toFixed(
                            2
                          )}</span>`
                        : ''
                    }
                    <span class="category-amount">RM ${amount.toFixed(2)}</span>
                </div>
            `);
      categoryListContainer.append(categoryItem);
    });
  }

  function resetCategoriesToZero() {
    categoryListContainer.empty();
    // Separate "Other Expenses" from other categories
    const otherExpensesCategory = categories.find(
      (cat) => cat.name === 'Other Expenses'
    );
    const otherCategories = categories.filter(
      (cat) => cat.name !== 'Other Expenses'
    );

    // Combine categories with "Other Expenses" at the end
    const orderedCategories = otherCategories.concat(
      otherExpensesCategory ? [otherExpensesCategory] : []
    );

    orderedCategories.forEach((category) => {
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
      showDenyButton: true,
      confirmButtonText: 'Save',
      denyButtonText: 'Allocate Budget',
      confirmButtonColor: '#4CAF50',
      denyButtonColor: '#17a2b8',
      cancelButtonColor: '#6c757d',
      backdrop: false, // Disable background dismiss
      inputValidator: (value) => {
        if (!value) return 'Please enter an amount!';
        if (value < 0) return 'Amount cannot be negative!';
      },
      didOpen: function () {
        // Get all buttons
        const denyBtn = document.querySelector('.swal2-deny');
        const confirmBtn = document.querySelector('.swal2-confirm');
        const cancelBtn = document.querySelector('.swal2-cancel');
        const buttonContainer = document.querySelector('.swal2-actions');

        if (denyBtn && confirmBtn && cancelBtn && buttonContainer) {
          // Clear the container
          buttonContainer.innerHTML = '';

          // Set full width style for allocate button
          denyBtn.style.width = '100%';
          denyBtn.style.marginBottom = '10px';

          // Set styles for save and cancel buttons
          const bottomButtonsWrapper = document.createElement('div');
          bottomButtonsWrapper.style.display = 'flex';
          bottomButtonsWrapper.style.gap = '10px';
          bottomButtonsWrapper.style.width = '100%';

          confirmBtn.style.flex = '1';
          cancelBtn.style.flex = '1';

          // Append buttons in new order
          buttonContainer.appendChild(denyBtn);
          bottomButtonsWrapper.appendChild(confirmBtn);
          bottomButtonsWrapper.appendChild(cancelBtn);
          buttonContainer.appendChild(bottomButtonsWrapper);
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const incomeAmount = parseFloat(result.value);
        expenses[monthKey].income = incomeAmount;

        user.expenses = expenses;

        users = users.map((u) => (u.username === username ? user : u));
        localStorage.setItem('users', JSON.stringify(users));

        showSuccessPopup(incomeAmount);
      } else if (result.isDenied) {
        // Dismiss overlay and open allocate budget dialog
        document.body.removeChild(overlay);
        showAllocateBudgetDialog();
        return;
      }
      // Remove the overlay when the modal is closed
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
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

    // If current month has no budget set, try to use previous month's budget
    if (!budgets[monthKey] || Object.keys(budgets[monthKey]).length === 0) {
      let prevMonth = currentMonth - 1;
      let prevYear = currentYear;

      // Handle month wrap-around
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = currentYear - 1;
      }

      const prevMonthKey = `${prevYear}-${prevMonth}`;
      if (
        budgets[prevMonthKey] &&
        Object.keys(budgets[prevMonthKey]).length > 0
      ) {
        return budgets[prevMonthKey];
      }
    }

    return budgets[monthKey] || {};
  }

  // Save budgets for the current month
  function saveBudgetsForMonth(budgets) {
    const monthKey = `${currentYear}-${currentMonth}`;
    let allBudgets = JSON.parse(localStorage.getItem('budgets')) || {};
    allBudgets[monthKey] = budgets;
    localStorage.setItem('budgets', JSON.stringify(allBudgets));
  }

  // Show allocate budget dialog
  function showAllocateBudgetDialog() {
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
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
  }

  // Add expense button click

  // Manage categories button click
  $('#manageCategoriesBtn').on('click', function () {
    showManageCategoriesDialog();
  });

  // Show manage categories dialog
  function showManageCategoriesDialog(editingCategoryIndex = null) {
    // Comprehensive list of Font Awesome icons (100 icons)
    const allIcons = [
      'fa-utensils',
      'fa-bus',
      'fa-bolt',
      'fa-heartbeat',
      'fa-film',
      'fa-shopping-bag',
      'fa-home',
      'fa-book',
      'fa-plane',
      'fa-dumbbell',
      'fa-gamepad',
      'fa-music',
      'fa-camera',
      'fa-gift',
      'fa-car',
      'fa-hospital',
      'fa-graduation-cap',
      'fa-briefcase',
      'fa-utensil-spoon',
      'fa-beer',
      'fa-pizza-slice',
      'fa-apple-alt',
      'fa-shopping-cart',
      'fa-hotel',
      'fa-plane-departure',
      'fa-train',
      'fa-paw',
      'fa-tv',
      'fa-laptop',
      'fa-mobile',
      'fa-headphones',
      'fa-watch',
      'fa-bicycle',
      'fa-motorcycle',
      'fa-ship',
      'fa-anchor',
      'fa-cocktail',
      'fa-coffee',
      'fa-tea',
      'fa-utensil',
      'fa-birthday-cake',
      'fa-ice-cream',
      'fa-candy',
      'fa-lollipop',
      'fa-chocolate',
      'fa-carrot',
      'fa-egg',
      'fa-cheese',
      'fa-drumstick',
      'fa-shrimp',
      'fa-leaf',
      'fa-flower',
      'fa-rose',
      'fa-sunflower',
      'fa-clover',
      'fa-four-leaf-clover',
      'fa-tree',
      'fa-forest',
      'fa-mountain',
      'fa-beach',
      'fa-island',
      'fa-sun',
      'fa-moon',
      'fa-cloud',
      'fa-cloud-rain',
      'fa-wind',
      'fa-snowflake',
      'fa-water',
      'fa-fire',
      'fa-star',
      'fa-heart',
      'fa-diamond',
      'fa-gem',
      'fa-crown',
      'fa-trophy',
      'fa-medal',
      'fa-ribbon',
      'fa-money-bill',
      'fa-dollar-sign',
      'fa-euro-sign',
      'fa-pound-sign',
      'fa-yen-sign',
      'fa-rupee-sign',
      'fa-credit-card',
      'fa-wallet',
      'fa-piggy-bank',
      'fa-vault',
      'fa-safe',
      'fa-lock',
      'fa-key',
      'fa-scissors',
      'fa-pencil',
      'fa-pen',
      'fa-palette',
      'fa-brush',
      'fa-ruler',
      'fa-hammer',
      'fa-wrench',
      'fa-screwdriver',
      'fa-toolbox',
    ];

    const categoryColors = [
      '#ff6384',
      '#36a2eb',
      '#ffce56',
      '#4bc0c0',
      '#9966ff',
      '#ff9f40',
      '#34495e',
      '#e74c3c',
      '#3498db',
      '#c9cbcf',
      '#1abc9c',
      '#f39c12',
      '#e67e22',
      '#95a5a6',
      '#d35400',
      '#c0392b',
      '#8e44ad',
      '#2980b9',
      '#27ae60',
      '#16a085',
      '#f1c40f',
      '#e91e63',
      '#9b59b6',
      '#f44336',
    ];
    const iconsPerPage = 15;
    let currentIconPage = 0;

    let categoryHTML = '<div class="category-management-form">';

    // Display existing categories
    categoryHTML += '<h5>Current Categories</h5>';
    categories.forEach((category, index) => {
      const isCustom = index >= defaultCategories.length;
      const isEditing = index === editingCategoryIndex;
      const highlightStyle = isEditing
        ? 'background-color: #e8f5e9; border: 2px solid #4CAF50;'
        : '';
      categoryHTML += `
        <div class="category-item-management ${
          isCustom && !isEditing ? 'cursor-pointer-category' : ''
        }" data-index="${index}" style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; ${highlightStyle} ${
        isCustom && !isEditing ? 'cursor: pointer;' : ''
      }">
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${category.icon}" style="color: ${
        category.color
      }; font-size: 20px;"></i>
            <span style="font-weight: bold;">${category.name}</span>
          </div>
          ${
            isCustom
              ? `<button type="button" class="delete-category-btn" data-index="${index}" style="background-color: #e74c3c; border: none; color: white; width: 32px; height: 32px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;"><i class="fas fa-trash" style="font-size: 14px;"></i></button>`
              : ''
          }
        </div>
      `;
    });

    // Add/Edit category form
    const isEditing =
      editingCategoryIndex !== null && editingCategoryIndex !== undefined;
    const editingCategory = isEditing ? categories[editingCategoryIndex] : null;
    const formTitle = isEditing
      ? `Update ${editingCategory.name} Category`
      : 'Add New Category';
    const buttonText = isEditing
      ? `Update ${editingCategory.name}`
      : 'Add Category';

    categoryHTML += `<hr><h5 style="margin-bottom: 20px;">${formTitle}</h5>`;
    categoryHTML += `
      <div class="add-category-form">
        <div style="margin-bottom: 15px;">
          <label for="newCategoryName" style="font-weight: 600; display: block; margin-bottom: 6px;">Category Name</label>
          <input type="text" id="newCategoryName" class="form-control" placeholder="Enter category name" value="${
            editingCategory ? editingCategory.name : ''
          }">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="font-weight: 600; display: block; margin-bottom: 6px;">Select Icon</label>
          <div id="iconPickerContainer" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
    `;

    // Display first batch of icons (14 icons + More button = 15 total slots)
    const startIdx = 0;
    const endIdx = Math.min(iconsPerPage - 1, allIcons.length); // 14 icons for first page
    for (let i = startIdx; i < endIdx; i++) {
      const icon = allIcons[i];
      const isSelected =
        editingCategory && editingCategory.icon === icon ? true : false;
      categoryHTML += `<button type="button" class="icon-picker-btn ${
        isSelected ? 'icon-selected' : ''
      }" data-icon="${icon}" style="width: 45px; height: 45px; border: ${
        isSelected ? '3px solid #4CAF50' : '2px solid #ddd'
      }; border-radius: 5px; cursor: pointer; background-color: #f9f9f9; font-size: 20px;"><i class="fas ${icon}"></i></button>`;
    }

    // More icons button with pagination (on 15th icon position)
    if (allIcons.length > endIdx) {
      categoryHTML += `<button type="button" id="loadMoreIconsBtn" data-page="0" style="width: 45px; height: 45px; border: 2px solid #ddd; border-radius: 5px; cursor: pointer; background-color: #f9f9f9; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 4px; text-align: center; word-wrap: break-word; line-height: 1.2;">More</button>`;
    }

    categoryHTML += `<div id="moreIconsContainer" style="display: none; margin-top: 10px;"></div>`;

    categoryHTML += `
          </div>
          <input type="hidden" id="newCategoryIcon" value="${
            editingCategory ? editingCategory.icon : ''
          }">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="font-weight: 600; display: block; margin-bottom: 6px;">Color</label>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; justify-content: center;">
    `;

    categoryColors.forEach((color) => {
      const isSelected =
        editingCategory && editingCategory.color === color ? true : false;
      categoryHTML += `<button type="button" class="color-picker-btn ${
        isSelected ? 'color-selected' : ''
      }" data-color="${color}" style="width: 40px; height: 40px; background-color: ${color}; border: ${
        isSelected ? '3px solid #000' : '2px solid #ddd'
      }; border-radius: 5px; cursor: pointer;"></button>`;
    });

    categoryHTML += `
          </div>
          <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
            <label for="customColorInput" style="font-size: 12px; color: #666; margin-bottom: 0;">Custom Color:</label>
            <input type="color" id="customColorInput" value="${
              editingCategory ? editingCategory.color : '#3498db'
            }" style="width: 50px; height: 36px; border: 2px solid #ddd; border-radius: 4px; cursor: pointer; padding: 2px;">
            <span id="customColorValue" style="font-size: 12px; color: #666; font-family: monospace; font-weight: bold;">${
              editingCategory ? editingCategory.color : '#3498db'
            }</span>
          </div>
          <input type="hidden" id="newCategoryColor" value="${
            editingCategory ? editingCategory.color : ''
          }">
        </div>
        ${
          isEditing
            ? `<button type="button" id="clearEditBtn" style="margin-top: 10px; padding: 8px 12px; background-color: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel Edit</button>`
            : ''
        }
      </div>
    </div>
    `;

    // Show the overlay
    const overlay = document.createElement('div');
    overlay.className = 'custom-overlay';
    document.body.appendChild(overlay);

    Swal.fire({
      title: 'Manage Categories',
      html: categoryHTML,
      width: '500px',
      showCancelButton: true,
      confirmButtonText: buttonText,
      cancelButtonText: 'Done',
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6c757d',
      backdrop: false,
      didOpen: function () {
        // Attach event listeners for category item click (to edit)
        document
          .querySelectorAll('.category-item-management')
          .forEach((item) => {
            const index = parseInt(item.getAttribute('data-index'));
            const isCustom = index >= defaultCategories.length;
            if (isCustom && index !== editingCategoryIndex) {
              item.addEventListener('click', function () {
                Swal.close();
                showManageCategoriesDialog(index);
              });
            }
          });

        // Attach event listeners for delete buttons
        document.querySelectorAll('.delete-category-btn').forEach((btn) => {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const index = this.getAttribute('data-index');
            const categoryName = categories[index].name;

            Swal.fire({
              title: 'Delete Category?',
              text: `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Delete',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#e74c3c',
              cancelButtonColor: '#6c757d',
              backdrop: false,
            }).then((result) => {
              if (result.isConfirmed) {
                categories.splice(index, 1);
                localStorage.setItem(
                  'userCategories',
                  JSON.stringify(categories)
                );
                Swal.close();
                showManageCategoriesDialog();
              }
            });
          });
        });

        // Attach event listeners for icon picker
        document.querySelectorAll('.icon-picker-btn').forEach((btn) => {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            document
              .querySelectorAll('.icon-picker-btn')
              .forEach((b) => (b.style.borderColor = '#ddd'));
            this.style.borderColor = '#4CAF50';
            this.style.borderWidth = '3px';
            document.getElementById('newCategoryIcon').value =
              this.getAttribute('data-icon');
          });
        });

        // Attach event listeners for color picker
        document.querySelectorAll('.color-picker-btn').forEach((btn) => {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            document
              .querySelectorAll('.color-picker-btn')
              .forEach((b) => (b.style.borderColor = '#ddd'));
            this.style.borderColor = '#000';
            this.style.borderWidth = '3px';
            document.getElementById('newCategoryColor').value =
              this.getAttribute('data-color');
            // Clear custom color selection when preset is clicked
            const customColorInput =
              document.getElementById('customColorInput');
            if (customColorInput) {
              customColorInput.value = this.getAttribute('data-color');
            }
          });
        });

        // Custom color picker event listener
        const customColorInput = document.getElementById('customColorInput');
        if (customColorInput) {
          customColorInput.addEventListener('change', function (e) {
            const selectedColor = this.value;
            document.getElementById('newCategoryColor').value = selectedColor;
            document.getElementById('customColorValue').textContent =
              selectedColor;
            // Deselect all preset color buttons
            document.querySelectorAll('.color-picker-btn').forEach((b) => {
              b.style.borderColor = '#ddd';
              b.style.borderWidth = '2px';
            });
          });

          customColorInput.addEventListener('input', function (e) {
            document.getElementById('customColorValue').textContent =
              this.value;
          });
        }

        // Cancel edit button
        const clearEditBtn = document.getElementById('clearEditBtn');
        if (clearEditBtn) {
          clearEditBtn.addEventListener('click', function () {
            Swal.close();
            showManageCategoriesDialog();
          });
        }

        // Load more icons button with pagination
        const loadMoreIconsBtn = document.getElementById('loadMoreIconsBtn');
        const moreIconsContainer =
          document.getElementById('moreIconsContainer');

        if (loadMoreIconsBtn) {
          loadMoreIconsBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const currentPage = parseInt(this.getAttribute('data-page'));
            const nextPage = currentPage + 1;
            const startIdx = nextPage * iconsPerPage;
            const endIdx = Math.min(startIdx + iconsPerPage, allIcons.length);

            let iconsWrapper =
              '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; justify-content: center;">';

            for (let i = startIdx; i < endIdx; i++) {
              const icon = allIcons[i];
              const isSelected =
                editingCategory && editingCategory.icon === icon ? true : false;
              iconsWrapper += `<button type="button" class="icon-picker-btn ${
                isSelected ? 'icon-selected' : ''
              }" data-icon="${icon}" style="width: 45px; height: 45px; border: ${
                isSelected ? '3px solid #4CAF50' : '2px solid #ddd'
              }; border-radius: 5px; cursor: pointer; background-color: #f9f9f9; font-size: 20px;"><i class="fas ${icon}"></i></button>`;
            }
            iconsWrapper += '</div>';

            // Add navigation controls
            let navHTML = `<div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: nowrap; width: 100%;">`;
            if (nextPage > 0) {
              navHTML += `<button type="button" class="prevPageBtn" style="padding: 0; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; min-width: 70px; max-width: 70px; width: 70px; height: 36px; white-space: nowrap; font-size: 13px; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;">Back</button>`;
            } else {
              navHTML += `<div style="min-width: 70px; width: 70px; flex-shrink: 0;"></div>`;
            }
            navHTML += `<span style="font-size: 12px; color: #666; min-width: 120px; text-align: center; flex-shrink: 0;">Page ${
              nextPage + 1
            } of ${Math.ceil(allIcons.length / iconsPerPage)}</span>`;
            if (endIdx < allIcons.length) {
              navHTML += `<button type="button" class="nextPageBtn" style="padding: 0; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; min-width: 70px; max-width: 70px; width: 70px; height: 36px; white-space: nowrap; font-size: 13px; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;">Next</button>`;
            } else {
              navHTML += `<div style="min-width: 70px; width: 70px; flex-shrink: 0;"></div>`;
            }
            navHTML += `</div>`;

            // Hide first page icons and replace with new page icons
            const iconPickerContainer = document.getElementById(
              'iconPickerContainer'
            );
            iconPickerContainer.innerHTML = iconsWrapper + navHTML;
            iconPickerContainer.style.display = 'block';
            iconPickerContainer.style.flexWrap = 'wrap';
            iconPickerContainer.style.gap = '8px';

            // Hide the more icons container since we're replacing first page content
            moreIconsContainer.style.display = 'none';
            moreIconsContainer.innerHTML = '';

            const navDiv = iconPickerContainer.querySelector('div:last-child');
            if (navDiv) {
              navDiv.style.display = 'flex';
              navDiv.style.width = '100%';
              navDiv.style.alignItems = 'center';
              navDiv.style.justifyContent = 'center';
              navDiv.style.gap = '10px';
            }

            this.setAttribute('data-page', nextPage);

            // Re-attach event listeners to new icon buttons
            iconPickerContainer
              .querySelectorAll('.icon-picker-btn')
              .forEach((btn) => {
                btn.addEventListener('click', function (e) {
                  e.preventDefault();
                  document
                    .querySelectorAll('.icon-picker-btn')
                    .forEach((b) => (b.style.borderColor = '#ddd'));
                  this.style.borderColor = '#4CAF50';
                  this.style.borderWidth = '3px';
                  document.getElementById('newCategoryIcon').value =
                    this.getAttribute('data-icon');
                });
              });

            // Attach pagination button listeners
            const prevBtn = iconPickerContainer.querySelector('.prevPageBtn');
            const nextBtn = iconPickerContainer.querySelector('.nextPageBtn');

            if (prevBtn) {
              prevBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadMoreIconsBtn.setAttribute('data-page', nextPage - 2);
                loadMoreIconsBtn.click();
              });
            }

            if (nextBtn) {
              nextBtn.addEventListener('click', function (e) {
                e.preventDefault();
                loadMoreIconsBtn.setAttribute('data-page', nextPage);
                loadMoreIconsBtn.click();
              });
            }

            loadMoreIconsBtn.style.display = 'none';
          });
        }

        // Scroll to bottom to show form
        const form = document.querySelector('.category-management-form');
        if (form) {
          form.style.maxHeight = '400px';
          form.style.overflowY = 'auto';
          setTimeout(() => (form.scrollTop = form.scrollHeight), 100);
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const newCategoryName = document
          .getElementById('newCategoryName')
          .value.trim();
        const newCategoryIcon =
          document.getElementById('newCategoryIcon').value;
        const newCategoryColor =
          document.getElementById('newCategoryColor').value;

        if (!newCategoryName) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Input',
            text: 'Please enter a category name.',
            confirmButtonColor: '#4CAF50',
          });
          return showManageCategoriesDialog(editingCategoryIndex);
        }

        if (!newCategoryIcon) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Input',
            text: 'Please select an icon.',
            confirmButtonColor: '#4CAF50',
          });
          return showManageCategoriesDialog(editingCategoryIndex);
        }

        if (!newCategoryColor) {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Input',
            text: 'Please select a color.',
            confirmButtonColor: '#4CAF50',
          });
          return showManageCategoriesDialog(editingCategoryIndex);
        }

        // Check if category name already exists (excluding the current category if editing)
        const isDuplicate = categories.some(
          (cat, idx) =>
            cat.name.toLowerCase() === newCategoryName.toLowerCase() &&
            idx !== editingCategoryIndex
        );

        if (isDuplicate) {
          Swal.fire({
            icon: 'warning',
            title: 'Duplicate Category',
            text: 'A category with this name already exists.',
            confirmButtonColor: '#4CAF50',
          });
          return showManageCategoriesDialog(editingCategoryIndex);
        }

        if (isEditing) {
          // Update existing category
          categories[editingCategoryIndex] = {
            name: newCategoryName,
            icon: newCategoryIcon,
            color: newCategoryColor,
          };

          localStorage.setItem('userCategories', JSON.stringify(categories));

          Swal.fire({
            title: 'Success!',
            text: `Category "${newCategoryName}" has been updated.`,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
          }).then(() => {
            location.reload();
          });
        } else {
          // Add new category
          categories.push({
            name: newCategoryName,
            icon: newCategoryIcon,
            color: newCategoryColor,
          });

          localStorage.setItem('userCategories', JSON.stringify(categories));

          Swal.fire({
            title: 'Success!',
            text: `Category "${newCategoryName}" has been added.`,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#4CAF50',
          }).then(() => {
            location.reload();
          });
        }
      }

      // Remove the overlay when the modal is closed
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    });
  }

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
