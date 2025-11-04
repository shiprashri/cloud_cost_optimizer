document.addEventListener("DOMContentLoaded", async () => {
  const cpuEl = document.getElementById("cpu");
  const memoryEl = document.getElementById("memory");
  const storageEl = document.getElementById("storage");
  const costEl = document.getElementById("cost");
  const suggestionsEl = document.getElementById("suggestions");
  const backBtn = document.getElementById("backBtn");
  const toggleBtn = document.getElementById("themeToggle");

  // 🧠 Apply saved theme on load
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") document.body.classList.add("dark-mode");
  updateThemeIcon();

  // 🌗 Toggle theme and save preference
  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const theme = localStorage.getItem("theme") || "light";
    toggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  try {
    // ✅ Fetch usage & cost data
    const res = await fetch("http://127.0.0.1:5000/report-data");
    const data = await res.json();

    if (!data || data.length === 0) {
      cpuEl.textContent = "N/A";
      memoryEl.textContent = "N/A";
      storageEl.textContent = "N/A";
      costEl.textContent = "N/A";
      suggestionsEl.innerHTML = `<p>No data available yet. Run a few predictions first.</p>`;
      return;
    }

    const latest = data[0];
    cpuEl.textContent = `${latest.cpu.toFixed(1)}%`;
    memoryEl.textContent = `${latest.memory.toFixed(1)} GB`;
    storageEl.textContent = `${latest.storage.toFixed(1)} GB`;
    costEl.textContent = `$${latest.cost.toFixed(2)}`;

    // ✅ Create trend chart
    const ctx = document.getElementById("reportChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(r => r.timestamp),
        datasets: [{
          label: "Cost Over Time ($)",
          data: data.map(r => r.cost),
          borderColor: "#4B9EFF",
          backgroundColor: "rgba(75, 158, 255, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: "Timestamp" } },
          y: { title: { display: true, text: "Cost ($)" }, beginAtZero: true }
        }
      }
    });

    // ✅ Fetch optimization insights
    const optRes = await fetch("http://127.0.0.1:5000/optimize");
    const optData = await optRes.json();

    // ✅ Display insights
    suggestionsEl.innerHTML = `
      <h3>🧠 Real-Time Optimization Insights</h3>
      <p><strong>Efficiency Score:</strong> ${optData.efficiency_score}%</p>
      <p><strong>Best Region:</strong> ${optData.best_region}</p>
      <p><strong>Recommended Instance:</strong> ${optData.best_instance}</p>
      <ul>${optData.tips.map(t => `<li>${t}</li>`).join("")}</ul>
    `;
  } catch (err) {
    console.error("❌ Error loading report data:", err);
    suggestionsEl.innerHTML = `<p class="error">Failed to load report data. Please try again.</p>`;
  }

  // ⬅ Back to dashboard
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
});
