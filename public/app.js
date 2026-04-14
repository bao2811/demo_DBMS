const fmtCurrency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const fmtNumber = new Intl.NumberFormat("vi-VN");

let salesChart;

const elements = {
  menuButtons: document.querySelectorAll(".menu-btn"),
  viewSections: document.querySelectorAll(".view-section"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  groupBy: document.getElementById("groupBy"),
  applyFilters: document.getElementById("applyFilters"),
  resetFilters: document.getElementById("resetFilters"),
  customerKeyword: document.getElementById("customerKeyword"),
  productKeyword: document.getElementById("productKeyword"),
  kpiRevenue: document.getElementById("kpiRevenue"),
  kpiOrders: document.getElementById("kpiOrders"),
  kpiCustomers: document.getElementById("kpiCustomers"),
  kpiItems: document.getElementById("kpiItems"),
  customerBody: document.querySelector("#customerTable tbody"),
  productBody: document.querySelector("#productTable tbody"),
  pivotRows: document.getElementById("pivotRows"),
  pivotCols: document.getElementById("pivotCols"),
  pivotMetric: document.getElementById("pivotMetric"),
  loadPivot: document.getElementById("loadPivot"),
  pivotHead: document.querySelector("#pivotTable thead"),
  pivotBody: document.querySelector("#pivotTable tbody"),
  searchCustomer: document.getElementById("searchCustomer"),
  searchProduct: document.getElementById("searchProduct"),
  searchBtn: document.getElementById("searchBtn"),
  searchBody: document.querySelector("#searchTable tbody"),
  chatMessages: document.getElementById("chatMessages"),
  chatInput: document.getElementById("chatInput"),
  chatSend: document.getElementById("chatSend"),
};

function switchView(view) {
  elements.menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  elements.viewSections.forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function addChatMessage(role, text) {
  const div = document.createElement("div");
  div.className = `chat-msg ${role}`;
  div.innerHTML = escapeHtml(text).replaceAll("\n", "<br>");
  elements.chatMessages.appendChild(div);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

async function answerChatbot(question) {
  const q = question.toLowerCase();
  const params = buildDateParams();

  if (q.includes("doanh thu") || q.includes("tong quan") || q.includes("kpi")) {
    const summary = await apiGet("analytics/summary", params);
    return [
      `Tong doanh thu: ${fmtCurrency.format(summary.totalRevenue || 0)}`,
      `So don hang: ${fmtNumber.format(summary.totalOrders || 0)}`,
      `So khach hang: ${fmtNumber.format(summary.totalCustomers || 0)}`,
    ].join("\n");
  }

  if (q.includes("top khach") || q.includes("khach hang tot")) {
    const rows = await apiGet(
      "customers/top",
      new URLSearchParams([...params, ["limit", "5"]]),
    );

    if (!rows.length) {
      return "Khong co du lieu top khach hang trong khoang thoi gian dang loc.";
    }

    return rows
      .map(
        (r, i) =>
          `${i + 1}. ${r.customerName} - ${fmtCurrency.format(r.revenue || 0)}`,
      )
      .join("\n");
  }

  if (q.includes("top mat hang") || q.includes("san pham ban chay")) {
    const rows = await apiGet(
      "products/top",
      new URLSearchParams([...params, ["limit", "5"]]),
    );

    if (!rows.length) {
      return "Khong co du lieu top mat hang trong khoang thoi gian dang loc.";
    }

    return rows
      .map(
        (r, i) =>
          `${i + 1}. ${r.productName} - ${fmtCurrency.format(r.revenue || 0)}`,
      )
      .join("\n");
  }

  if (q.includes("tim don") || q.includes("tim kiem")) {
    return "Ban co the nhap Khach hang va Mat hang o khu Tim kiem don hang chi tiet, sau do bam Tim kiem.";
  }

  return "Toi co the tra loi: tong quan doanh thu, top khach hang, top mat hang, tim don hang.";
}

async function handleChatSend() {
  const question = elements.chatInput.value.trim();
  if (!question) {
    return;
  }

  addChatMessage("user", question);
  elements.chatInput.value = "";
  addChatMessage("bot", "Dang xu ly...");

  try {
    const answer = await answerChatbot(question);
    const loading = elements.chatMessages.querySelector(
      ".chat-msg.bot:last-child",
    );
    if (loading) {
      loading.remove();
    }
    addChatMessage("bot", answer);
  } catch (error) {
    const loading = elements.chatMessages.querySelector(
      ".chat-msg.bot:last-child",
    );
    if (loading) {
      loading.remove();
    }
    addChatMessage("bot", `Loi: ${error.message}`);
  }
}

function defaultDateRange() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 6);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function buildDateParams() {
  const params = new URLSearchParams();

  if (elements.fromDate.value) {
    params.set("from", elements.fromDate.value);
  }

  if (elements.toDate.value) {
    params.set("to", elements.toDate.value);
  }

  return params;
}

async function apiGet(path, params = new URLSearchParams()) {
  const query = params.toString();
  const url = query ? `/api/v1/${path}?${query}` : `/api/v1/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

function renderSalesChart(rows) {
  const labels = rows.map((r) => r.period);
  const data = rows.map((r) => Number(r.revenue || 0));

  if (salesChart) {
    salesChart.destroy();
  }

  const ctx = document.getElementById("salesChart").getContext("2d");
  salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Doanh thu",
          data,
          borderColor: "#146c94",
          borderWidth: 3,
          pointRadius: 2,
          tension: 0.3,
          fill: true,
          backgroundColor: "rgba(20,108,148,0.12)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return fmtCurrency.format(context.raw || 0);
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => fmtNumber.format(value),
          },
        },
      },
    },
  });
}

function renderRows(bodyEl, html) {
  bodyEl.innerHTML = html || '<tr><td colspan="10">Khong co du lieu</td></tr>';
}

function loadKpis(summary) {
  elements.kpiRevenue.textContent = fmtCurrency.format(
    summary.totalRevenue || 0,
  );
  elements.kpiOrders.textContent = fmtNumber.format(summary.totalOrders || 0);
  elements.kpiCustomers.textContent = fmtNumber.format(
    summary.totalCustomers || 0,
  );
  elements.kpiItems.textContent = fmtNumber.format(summary.totalItems || 0);
}

function loadCustomerTable(rows) {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td>${r.customerName}</td>
        <td>${r.country || ""}</td>
        <td>${fmtNumber.format(r.orders || 0)}</td>
        <td>${fmtCurrency.format(r.revenue || 0)}</td>
      </tr>
    `,
    )
    .join("");

  renderRows(elements.customerBody, html);
}

function loadProductTable(rows) {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td>${r.productCode}</td>
        <td>${r.productName}</td>
        <td>${r.productLine || ""}</td>
        <td>${fmtNumber.format(r.qty || 0)}</td>
        <td>${fmtCurrency.format(r.revenue || 0)}</td>
      </tr>
    `,
    )
    .join("");

  renderRows(elements.productBody, html);
}

function loadPivotTable(pivot) {
  const headHtml = `
    <tr>
      <th>${pivot.rowKey}</th>
      ${pivot.colLabels.map((c) => `<th>${c}</th>`).join("")}
    </tr>
  `;

  const bodyHtml = pivot.rowLabels
    .map((rowLabel, i) => {
      const cells = pivot.matrix[i]
        .map((value) => `<td>${fmtNumber.format(value)}</td>`)
        .join("");
      return `<tr><td><strong>${rowLabel}</strong></td>${cells}</tr>`;
    })
    .join("");

  elements.pivotHead.innerHTML = headHtml;
  elements.pivotBody.innerHTML = bodyHtml;
}

function loadSearchTable(rows) {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td>${String(r.orderDate).slice(0, 10)}</td>
        <td>${r.orderNumber}</td>
        <td>${r.status}</td>
        <td>${r.customerName}</td>
        <td>${r.productCode}</td>
        <td>${r.productName}</td>
        <td>${r.productLine || ""}</td>
        <td>${fmtNumber.format(r.quantityOrdered || 0)}</td>
        <td>${fmtCurrency.format(r.priceEach || 0)}</td>
        <td>${fmtCurrency.format(r.lineRevenue || 0)}</td>
      </tr>
    `,
    )
    .join("");

  renderRows(elements.searchBody, html);
}

async function refreshDashboard() {
  const params = buildDateParams();
  const groupBy = elements.groupBy.value;

  const [summary, sales, customers, products, pivot] = await Promise.all([
    apiGet("analytics/summary", params),
    apiGet(
      "analytics/sales",
      new URLSearchParams([...params, ["groupBy", groupBy]]),
    ),
    apiGet(
      "customers/top",
      new URLSearchParams([
        ...params,
        ["q", elements.customerKeyword.value.trim()],
        ["limit", "15"],
      ]),
    ),
    apiGet(
      "products/top",
      new URLSearchParams([
        ...params,
        ["q", elements.productKeyword.value.trim()],
        ["limit", "15"],
      ]),
    ),
    apiGet(
      "reports/pivot",
      new URLSearchParams([
        ...params,
        ["rows", elements.pivotRows.value],
        ["cols", elements.pivotCols.value],
        ["metric", elements.pivotMetric.value],
      ]),
    ),
  ]);

  loadKpis(summary);
  renderSalesChart(sales);
  loadCustomerTable(customers);
  loadProductTable(products);
  loadPivotTable(pivot);
}

async function runSearch() {
  const params = buildDateParams();
  params.set("customer", elements.searchCustomer.value.trim());
  params.set("product", elements.searchProduct.value.trim());
  params.set("limit", "200");

  const rows = await apiGet("orders", params);
  loadSearchTable(rows);
}

async function bootstrap() {
  const dr = defaultDateRange();
  elements.fromDate.value = dr.from;
  elements.toDate.value = dr.to;

  addChatMessage(
    "bot",
    "Xin chao. Ban co the hoi: tong quan doanh thu, top khach hang, top mat hang.",
  );

  try {
    await refreshDashboard();
    await runSearch();
  } catch (error) {
    alert(`Loi khi tai du lieu: ${error.message}`);
  }
}

elements.applyFilters.addEventListener("click", async () => {
  try {
    await refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
});

elements.resetFilters.addEventListener("click", async () => {
  const dr = defaultDateRange();
  elements.fromDate.value = dr.from;
  elements.toDate.value = dr.to;
  elements.customerKeyword.value = "";
  elements.productKeyword.value = "";
  elements.groupBy.value = "month";

  try {
    await refreshDashboard();
    await runSearch();
  } catch (error) {
    alert(error.message);
  }
});

elements.customerKeyword.addEventListener("change", refreshDashboard);
elements.productKeyword.addEventListener("change", refreshDashboard);
elements.loadPivot.addEventListener("click", refreshDashboard);
elements.searchBtn.addEventListener("click", runSearch);
elements.chatSend.addEventListener("click", handleChatSend);
elements.chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleChatSend();
  }
});
elements.menuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchView(button.dataset.view);
  });
});

bootstrap();
