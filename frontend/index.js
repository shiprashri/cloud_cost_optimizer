document.addEventListener("DOMContentLoaded", async () => {
  const totalRecordsCard = document.getElementById("totalRecordsCard");
  const toggleButton = document.getElementById("theme-toggle");
  const currencyButton = document.getElementById("currency-toggle");
  const body = document.body;

  // 🌍 Currency state
  let currency = localStorage.getItem("currency") || "USD";

  // ⚙️ Function to format currency
  const formatCurrency = (value) =>
    currency === "INR"
      ? `₹${(value * 83).toFixed(2)}`
      : `$${(value || 0).toFixed(2)}`;

  // ✅ Load Dashboard Metrics & Chart
  async function loadDashboard() {
    try {
      const res = await fetch("http://127.0.0.1:5000/dashboard-data");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const s = data.summary;
      document.getElementById("total-records").innerText = s.total_records || 0;
      document.getElementById("average-cost").innerText = formatCurrency(s.avg_cost || 0);
      document.getElementById("last-prediction").innerText = formatCurrency(s.last_prediction || 0);
      document.getElementById("avg-cpu").innerText = `${(s.avg_cpu || 0).toFixed(1)}%`;
      document.getElementById("avg-memory").innerText = `${(s.avg_memory || 0).toFixed(1)} GB`;
      document.getElementById("avg-storage").innerText = `${(s.avg_storage || 0).toFixed(1)} GB`;

      const ctx = document.getElementById("costChart").getContext("2d");

      // 🧹 Destroy old chart if exists
      if (window.costChart instanceof Chart) window.costChart.destroy();

      // 🎨 Render chart
      window.costChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.trend.map((t) => new Date(t.timestamp).toLocaleTimeString()),
          datasets: [
            {
              label: `Cost Trend (${currency === "INR" ? "₹" : "$"})`,
              data: data.trend.map((t) =>
                currency === "INR" ? t.cost * 83 : t.cost
              ),
              borderColor: "#4f46e5",
              backgroundColor: "rgba(79,70,229,0.1)",
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } },
          scales: { y: { beginAtZero: true } },
        },
      });
    } catch (err) {
      console.error("⚠️ Error loading dashboard:", err);
    }
  }

  // ✅ Load Optimization Insights
  async function loadOptimization() {
    try {
      const res = await fetch("http://127.0.0.1:5000/optimize");
      const data = await res.json();

      document.getElementById("best-region").textContent = data.best_region || "N/A";
      document.getElementById("best-instance").textContent = data.best_instance || "N/A";
      document.getElementById("efficiency-score").textContent = `${data.efficiency_score || 0}%`;

      const tipsList = document.getElementById("tips-list");
      tipsList.innerHTML = "";
      (data.tips || []).forEach((tip) => {
        const li = document.createElement("li");
        li.textContent = tip;
        tipsList.appendChild(li);
      });
    } catch (err) {
      console.error("⚠️ Error fetching optimization data:", err);
    }
  }

  // 🌓 Theme Toggle
  toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    toggleButton.textContent = body.classList.contains("dark-mode") ? "☀️" : "🌙";
    localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
  });

  // 💱 Currency Toggle
  currencyButton.addEventListener("click", () => {
    currency = currency === "USD" ? "INR" : "USD";
    localStorage.setItem("currency", currency);
    loadDashboard();
  });

  // ♻️ Load saved preferences
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark-mode");
    toggleButton.textContent = "☀️";
  }
  if (currency === "INR") currencyButton.textContent = "₹ / $";

  // 🔄 Auto refresh
  loadDashboard();
  loadOptimization();
  setInterval(loadDashboard, 10000);
  setInterval(loadOptimization, 15000);

  // 📜 Navigation
  totalRecordsCard.addEventListener("click", () => {
    window.location.href = "history.html";
  });
});
