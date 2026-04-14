const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

const PIVOT_DIMENSIONS = {
  customer: "c.customerName",
  productLine: "p.productLine",
  country: "c.country",
  status: "o.status",
  month: "DATE_FORMAT(o.orderDate, '%Y-%m')",
};

function buildDateClause({ from, to }, alias = "o") {
  const parts = [];
  const replacements = {};

  if (from) {
    parts.push(`${alias}.orderDate >= :from`);
    replacements.from = from;
  }

  if (to) {
    parts.push(`${alias}.orderDate <= :to`);
    replacements.to = to;
  }

  return {
    where: parts.length ? `WHERE ${parts.join(" AND ")}` : "",
    replacements,
  };
}

function salesGroupExpr(groupBy) {
  return groupBy === "day"
    ? "DATE_FORMAT(o.orderDate, '%Y-%m-%d')"
    : "DATE_FORMAT(o.orderDate, '%Y-%m')";
}

async function getSummary(query) {
  const { where, replacements } = buildDateClause(query);

  const rows = await sequelize.query(
    `
      SELECT
        COUNT(DISTINCT o.orderNumber) AS totalOrders,
        COUNT(DISTINCT o.customerNumber) AS totalCustomers,
        COALESCE(SUM(od.quantityOrdered), 0) AS totalItems,
        COALESCE(SUM(od.quantityOrdered * od.priceEach), 0) AS totalRevenue
      FROM orders o
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      ${where}
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  return (
    rows[0] || {
      totalOrders: 0,
      totalCustomers: 0,
      totalItems: 0,
      totalRevenue: 0,
    }
  );
}

async function getSalesOverTime(query) {
  const { where, replacements } = buildDateClause(query);
  const groupExpr = salesGroupExpr(query.groupBy);

  return sequelize.query(
    `
      SELECT
        ${groupExpr} AS period,
        COALESCE(SUM(od.quantityOrdered * od.priceEach), 0) AS revenue,
        COALESCE(SUM(od.quantityOrdered), 0) AS qty
      FROM orders o
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      ${where}
      GROUP BY period
      ORDER BY period
    `,
    { replacements, type: QueryTypes.SELECT },
  );
}

async function getTopCustomers(query) {
  const { where, replacements } = buildDateClause(query);
  const limit = Math.min(Number(query.limit || 15), 100);
  const whereParts = [];

  if (where) {
    whereParts.push(where.replace(/^WHERE\s*/, ""));
  }

  if (query.q) {
    whereParts.push("c.customerName LIKE :customerKeyword");
    replacements.customerKeyword = `%${query.q}%`;
  }

  replacements.limit = limit;
  const finalWhere = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  return sequelize.query(
    `
      SELECT
        c.customerNumber,
        c.customerName,
        c.country,
        COALESCE(SUM(od.quantityOrdered * od.priceEach), 0) AS revenue,
        COUNT(DISTINCT o.orderNumber) AS orders
      FROM orders o
      JOIN customers c ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      ${finalWhere}
      GROUP BY c.customerNumber, c.customerName, c.country
      ORDER BY revenue DESC
      LIMIT :limit
    `,
    { replacements, type: QueryTypes.SELECT },
  );
}

async function getTopProducts(query) {
  const { where, replacements } = buildDateClause(query);
  const limit = Math.min(Number(query.limit || 15), 100);
  const whereParts = [];

  if (where) {
    whereParts.push(where.replace(/^WHERE\s*/, ""));
  }

  if (query.q) {
    whereParts.push(
      "(p.productName LIKE :productKeyword OR p.productLine LIKE :productKeyword)",
    );
    replacements.productKeyword = `%${query.q}%`;
  }

  replacements.limit = limit;
  const finalWhere = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  return sequelize.query(
    `
      SELECT
        p.productCode,
        p.productName,
        p.productLine,
        COALESCE(SUM(od.quantityOrdered * od.priceEach), 0) AS revenue,
        COALESCE(SUM(od.quantityOrdered), 0) AS qty
      FROM orders o
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      JOIN products p ON p.productCode = od.productCode
      ${finalWhere}
      GROUP BY p.productCode, p.productName, p.productLine
      ORDER BY revenue DESC
      LIMIT :limit
    `,
    { replacements, type: QueryTypes.SELECT },
  );
}

async function getPivot(query) {
  const rows = query.rows || "customer";
  const cols = query.cols || "productLine";
  const metric = query.metric || "revenue";

  if (!PIVOT_DIMENSIONS[rows] || !PIVOT_DIMENSIONS[cols]) {
    throw new Error("INVALID_DIMENSION");
  }

  const { where, replacements } = buildDateClause(query);
  const metricExpr =
    metric === "qty"
      ? "COALESCE(SUM(od.quantityOrdered), 0)"
      : "COALESCE(SUM(od.quantityOrdered * od.priceEach), 0)";

  const data = await sequelize.query(
    `
      SELECT
        ${PIVOT_DIMENSIONS[rows]} AS rowKey,
        ${PIVOT_DIMENSIONS[cols]} AS colKey,
        ${metricExpr} AS value
      FROM orders o
      JOIN customers c ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      JOIN products p ON p.productCode = od.productCode
      ${where}
      GROUP BY rowKey, colKey
      ORDER BY rowKey, colKey
    `,
    { replacements, type: QueryTypes.SELECT },
  );

  const rowLabels = [...new Set(data.map((item) => item.rowKey || "(empty)"))];
  const colLabels = [...new Set(data.map((item) => item.colKey || "(empty)"))];
  const matrix = rowLabels.map(() => colLabels.map(() => 0));

  const rowIndex = new Map(rowLabels.map((value, index) => [value, index]));
  const colIndex = new Map(colLabels.map((value, index) => [value, index]));

  data.forEach((item) => {
    const r = rowIndex.get(item.rowKey || "(empty)");
    const c = colIndex.get(item.colKey || "(empty)");
    matrix[r][c] = Number(item.value || 0);
  });

  return { rowKey: rows, colKey: cols, metric, rowLabels, colLabels, matrix };
}

async function searchOrders(query) {
  const { from, to, customer, product } = query;
  const limit = Math.min(Number(query.limit || 200), 1000);
  const whereParts = [];
  const replacements = { limit };

  if (from) {
    whereParts.push("o.orderDate >= :from");
    replacements.from = from;
  }

  if (to) {
    whereParts.push("o.orderDate <= :to");
    replacements.to = to;
  }

  if (customer) {
    whereParts.push("c.customerName LIKE :customer");
    replacements.customer = `%${customer}%`;
  }

  if (product) {
    whereParts.push(
      "(p.productName LIKE :product OR p.productCode LIKE :product)",
    );
    replacements.product = `%${product}%`;
  }

  const whereClause = whereParts.length
    ? `WHERE ${whereParts.join(" AND ")}`
    : "";

  return sequelize.query(
    `
      SELECT
        o.orderNumber,
        o.orderDate,
        o.status,
        c.customerName,
        p.productCode,
        p.productName,
        p.productLine,
        od.quantityOrdered,
        od.priceEach,
        (od.quantityOrdered * od.priceEach) AS lineRevenue
      FROM orders o
      JOIN customers c ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      JOIN products p ON p.productCode = od.productCode
      ${whereClause}
      ORDER BY o.orderDate DESC, o.orderNumber DESC
      LIMIT :limit
    `,
    { replacements, type: QueryTypes.SELECT },
  );
}

module.exports = {
  getSummary,
  getSalesOverTime,
  getTopCustomers,
  getTopProducts,
  getPivot,
  searchOrders,
};
