document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#historyTable tbody");
  const backBtn = document.getElementById("backBtn");
  const clearBtn = document.getElementById("clearHistoryBtn");
  const themeToggle = document.getElementById("theme-toggle");
  const currencyToggle = document.getElementById("currency-toggle");

  // ===============================
  // 🌗 THEME HANDLING
  // ===============================
  let currentTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", currentTheme === "dark");
  updateThemeIcon();

  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
    document.body.classList.toggle("dark-mode", currentTheme === "dark");
    updateThemeIcon();
  });

  function updateThemeIcon() {
    themeToggle.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  }

  // ===============================
  // 💰 CURRENCY HANDLING
  // ===============================
  const USD_TO_INR = 83.2;
  let currentCurrency = localStorage.getItem("currency") || "USD";
  updateCurrencyButton();

  currencyToggle.addEventListener("click", () => {
    currentCurrency = currentCurrency === "USD" ? "INR" : "USD";
    localStorage.setItem("currency", currentCurrency);
    updateCurrencyButton();
    updateTableCurrency();
  });

  function updateCurrencyButton() {
    currencyToggle.textContent =
      currentCurrency === "USD" ? "💵 USD" : "₹ INR";
  }

  // ===============================
  // 📜 LOAD HISTORY
  // ===============================
  function loadHistory() {
    const history =
      JSON.parse(localStorage.getItem("estimation_history")) || [];

    tableBody.innerHTML = "";

    if (history.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10">No history found.</td></tr>`;
      return;
    }

    history.reverse().forEach((entry) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${entry.timestamp}</td>
        <td>${entry.cpu}</td>
        <td>${entry.memory}</td>
        <td>${entry.storage}</td>
        <td>${entry.hours_used}</td>
        <td>${entry.instance_type}</td>
        <td>${entry.region}</td>
        <td>${entry.usage_type}</td>
        <td>${entry.service_tier}</td>
        <td data-usd="${entry.estimated_cost}"></td>
      `;

      tableBody.appendChild(row);
    });

    updateTableCurrency();
  }

  // ===============================
  // 💵 UPDATE TABLE CURRENCY
  // ===============================
  function updateTableCurrency() {
    const rows = tableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const costCell = row.cells[9];
      if (costCell && costCell.dataset.usd) {
        const usdValue = parseFloat(costCell.dataset.usd);
        costCell.textContent =
          currentCurrency === "USD"
            ? `$${usdValue.toFixed(2)}`
            : `₹${(usdValue * USD_TO_INR).toFixed(2)}`;
      }
    });
  }

  // ===============================
  // 🧹 CLEAR HISTORY
  // ===============================
  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem("estimation_history");
      loadHistory();
    }
  });

  // ===============================
  // ⬅ BACK BUTTON
  // ===============================
  backBtn.addEventListener("click", () => {
    window.location.href = "cost_estimator.html";
  });

  // ===============================
  // INITIAL LOAD
  // ===============================
  loadHistory();
});
