$(document).ready(function() {
    const appContainer = $('#app-container');
    const expenseList = $('#expense-list');
    const totalAmount = $('#totalAmount');
    const monthsContainer = $('#monthsContainer');
    const pieChartContainer = $('#pieChartContainer');
    const ctx = document.getElementById('expensePieChart').getContext('2d');
    const categoryListContainer = $('#categoryListContainer');
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
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
            const scrollPosition = activeBtn.position().left + monthsContainer.scrollLeft() - (containerWidth / 2 - buttonWidth / 2);
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
        { name: 'Other Expenses', icon: 'fa-ellipsis-h', color: '#c9cbcf' }
    ];
  
    function populateCategoriesWithAmounts(categoryTotals) {
        categoryListContainer.empty();
        // Sort categories by amount in descending order
        const sortedCategories = categories.sort((a, b) => (categoryTotals[b.name] || 0) - (categoryTotals[a.name] || 0));
        sortedCategories.forEach(category => {
            const amount = categoryTotals[category.name] || 0;
            const categoryItem = $(`
                <div class="category-item">
                    <div class="category-icon" style="background-color: ${category.color};">
                        <i class="fas ${category.icon}"></i>
                    </div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-amount">RM ${amount.toFixed(2)}</span>
                </div>
            `);
            categoryListContainer.append(categoryItem);
        });
    }
  
    function resetCategoriesToZero() {
        categoryListContainer.empty();
        categories.forEach(category => {
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
    $('#monthsContainer').on('click', '.month-btn', function() {
        $('.month-btn').removeClass('active');
        $(this).addClass('active');
        currentMonth = $(this).data('month');
        currentYear = $(this).data('year');
        centerMonthButton();
        displayExpenses();
    });
  
    // Display expenses
    function displayExpenses() {
      const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort expenses by date, latest first
  
      expenseList.empty();
      let total = 0;
      let categoryTotals = {};
  
      if (monthExpenses.length === 0) {
          totalAmount.html(`<span>RM 0.00</span>`);
          resetCategoriesToZero();
          hideChart();
          return;
      }
  
      monthExpenses.forEach((expense, index) => {
          if (!categoryTotals[expense.category]) {
              categoryTotals[expense.category] = 0;
          }
          categoryTotals[expense.category] += parseFloat(expense.amount);
          total += parseFloat(expense.amount);
          expenseList.append(`
              <tr>
                  <td>${expense.date}</td>
                  <td>${expense.category}</td>
                  <td>${expense.amount}</td>
                  <td>${expense.description}</td>
                  <td>
                      <button class="btn btn-warning btn-sm edit-btn" data-index="${index}" data-month="${currentMonth}">Edit</button>
                  </td>
              </tr>
          `);
      });
  
      // Update the edit expense indices to match the sorted list
      expenseList.find('.edit-btn').each(function(index, button) {
          const originalIndex = $(button).data('index');
          const expense = monthExpenses[originalIndex];
          $(button).data('index', expenses.indexOf(expense));
      });
  
      totalAmount.html(`<span>RM ${total.toFixed(2)}</span>`);  // Update to use HTML with span
  
      populateCategoriesWithAmounts(categoryTotals);
      displayChartFromCategoryList(categoryTotals, total);
    }
  
    // Function to hide the pie chart
    function hideChart() {
        if (myChart) {
            myChart.destroy();
            myChart = null;
        }
        pieChartContainer.hide();
    }
  
    // Function to display the pie chart using data from the category list
    function displayChartFromCategoryList(categoryTotals, total) {
      const labels = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);
      const backgroundColors = labels.map(label => categories.find(cat => cat.name === label).color);
  
      // Calculate percentages
      const percentages = data.map(value => ((value / total) * 100).toFixed(1));
  
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
                  datasets: [{
                      data: data,
                      backgroundColor: backgroundColors
                  }]
              },
              options: {
                  cutout: '70%', // Make the doughnut thinner
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: {
                          display: false
                      },
                      tooltip: {
                          callbacks: {
                              label: function(tooltipItem, chartData) {
                                  const totalValue = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
                                  const currentValue = chartData.datasets[0].data[tooltipItem.dataIndex];
                                  const percentage = ((currentValue / totalValue) * 100).toFixed(1);
                                  return `${chartData.labels[tooltipItem.dataIndex]}: RM ${currentValue.toFixed(2)} (${percentage}%)`;
                              }
                          }
                      },
                      datalabels: {
                          color: '#fff',
                          display: (context) => {
                              return context.dataset.data[context.dataIndex] > 0; // Only display if value is greater than 0
                          },
                          formatter: (value, ctx) => {
                              let percentage = percentages[ctx.dataIndex];
                              return `${percentage}%`;
                          },
                          font: {
                              weight: 'bold'
                          },
                          padding: 6
                      }
                  }
              },
              plugins: [ChartDataLabels] // Register the datalabels plugin
          });
      } else {
          myChart.data.labels = labels;
          myChart.data.datasets[0].data = data;
          myChart.data.datasets[0].backgroundColor = backgroundColors;
          myChart.options.cutout = '70%'; // Make the doughnut thinner
          myChart.options.plugins.tooltip.callbacks.label = function(tooltipItem, chartData) {
              const totalValue = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
              const currentValue = chartData.datasets[0].data[tooltipItem.dataIndex];
              const percentage = ((currentValue / totalValue) * 100).toFixed(1);
              return `${chartData.labels[tooltipItem.dataIndex]}: RM ${currentValue.toFixed(2)} (${percentage}%)`;
          };
          myChart.options.plugins.datalabels.formatter = function(value, ctx) {
              let percentage = percentages[ctx.dataIndex];
              return `${percentage}%`;
          };
          myChart.update();
      }
    }
  
    // Add expense button click
    $('#addExpenseBtn').on('click', function() {
        window.location.href = 'addExpense.html';
    });
  
    // Edit expense button click
    expenseList.on('click', '.edit-btn', function() {
        const index = $(this).data('index');
        const month = $(this).data('month');
        localStorage.setItem('editExpenseIndex', index);
        localStorage.setItem('editExpenseMonth', month);
        window.location.href = 'editExpense.html';
    });
  
    // Logout functionality
    $('#logoutBtn').on('click', function() {
        isLoggedIn = false;
        localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
        window.location.href = 'index.html';
    });
  
    // Initial display
    centerMonthButton(); // Center the current month button on initial load
    displayExpenses();
  });
  