document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("costForm");
  const resultCost = document.getElementById("resultCost");
  const currencySelect = document.getElementById("currencySelect");
  const toggleBtn = document.getElementById("themeToggle");
  const backBtn = document.getElementById("backBtn");
  const reportBtn = document.getElementById("reportBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const ctx = document.getElementById("costChart").getContext("2d");

  let costChart;
  let currentCostUSD = 0;
  const INR_RATE = 84.0;

  // 🌗 Theme setup
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("dark-mode", savedTheme === "dark");
  toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  // 💱 Currency setup
  const savedCurrency = localStorage.getItem("currency") || "USD";
  currencySelect.value = savedCurrency;

  // 🌙 Theme toggle
  toggleBtn.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    document.body.classList.toggle("dark-mode", newTheme === "dark");
    toggleBtn.textContent = newTheme === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", newTheme);
    updateChartColors();
  });

  // 💱 Currency change
  currencySelect.addEventListener("change", () => {
    localStorage.setItem("currency", currencySelect.value);
    updateCurrencyDisplay();
  });

  // 🧾 Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      cpu: +document.getElementById("cpu").value,
      memory: +document.getElementById("memory").value,
      storage: +document.getElementById("storage").value,
      hours_used: +document.getElementById("hours_used").value,
      instance_type: document.getElementById("instance_type").value,
      region: document.getElementById("region").value,
      usage_type: document.getElementById("usage_type").value,
      storage_type: document.getElementById("storage_type").value,
      service_tier: document.getElementById("service_tier").value,
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/predict_cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.estimated_cost) {
        currentCostUSD = parseFloat(result.estimated_cost);
        updateCurrencyDisplay();
        renderChart();
        downloadBtn.style.display = "block";
        reportBtn.style.display = "block";
      }
    } catch (err) {
      console.error("Error:", err);
    }
  });

  // 💱 Currency Display Update
  function updateCurrencyDisplay() {
    const currency = currencySelect.value;
    const converted = currency === "INR" ? currentCostUSD * INR_RATE : currentCostUSD;
    const symbol = currency === "INR" ? "₹" : "$";
    resultCost.textContent = `${symbol}${converted.toFixed(2)}`;

    if (costChart) {
      costChart.data.datasets[0].label = `Predicted Cost (${symbol})`;
      costChart.data.datasets[0].data = [converted];
      costChart.update();
    }
  }

  // 📊 Chart
  function renderChart() {
    if (costChart) costChart.destroy();
    const isDark = document.body.classList.contains("dark-mode");
    const textColor = isDark ? "#f8fafc" : "#111";

    costChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Estimated Cost"],
        datasets: [
          {
            label: `Predicted Cost (${currencySelect.value === "INR" ? "₹" : "$"})`,
            data: [currentCostUSD * (currencySelect.value === "INR" ? INR_RATE : 1)],
            backgroundColor: "#42a5f5",
            borderColor: "#1e40af",
            borderWidth: 2,
            borderRadius: 10,
          },
        ],
      },
      options: {
        plugins: {
          legend: { labels: { color: textColor } },
          title: { display: true, text: "Cloud Cost Estimation", color: textColor },
        },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor }, beginAtZero: true },
        },
      },
    });
  }

  function updateChartColors() {
    if (!costChart) return;
    const color = document.body.classList.contains("dark-mode") ? "#f8fafc" : "#111";
    costChart.options.plugins.legend.labels.color = color;
    costChart.options.plugins.title.color = color;
    costChart.options.scales.x.ticks.color = color;
    costChart.options.scales.y.ticks.color = color;
    costChart.update();
  }

  // 🧭 Navigation
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  reportBtn.addEventListener("click", () => {
    window.location.href = "report.html";
  });

  // ⬇️ Download CSV
  downloadBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/download_report");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cloud_cost_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
      console.error(err);
    }
  });
});
