const express = require("express");
const pool = require("../db");

const router = express.Router();

const DIMENSIONS = {
  customer: "c.customerName",
  productLine: "p.productLine",
  country: "c.country",
  status: "o.status",
  month: "DATE_FORMAT(o.orderDate, '%Y-%m')",
};

function parseDateFilters(query) {
  const { from, to } = query;
  const filters = [];
  const params = [];

  if (from) {
    filters.push("o.orderDate >= ?");
    params.push(from);
  }

  if (to) {
    filters.push("o.orderDate <= ?");
    params.push(to);
  }

  return {
    where: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    params,
  };
}

function normalizeGroupBy(groupBy) {
  return groupBy === "day"
    ? "DATE_FORMAT(o.orderDate, '%Y-%m-%d')"
    : "DATE_FORMAT(o.orderDate, '%Y-%m')";
}

router.get("/summary", async (req, res, next) => {
  try {
    const { where, params } = parseDateFilters(req.query);

    const [rows] = await pool.query(
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
      params,
    );

    res.json(rows[0] || {});
  } catch (error) {
    next(error);
  }
});

router.get("/sales-over-time", async (req, res, next) => {
  try {
    const { where, params } = parseDateFilters(req.query);
    const groupExpr = normalizeGroupBy(req.query.groupBy);

    const [rows] = await pool.query(
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
      params,
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/top-customers", async (req, res, next) => {
  try {
    const { where, params } = parseDateFilters(req.query);
    const search = req.query.q ? `%${req.query.q}%` : null;
    const limit = Math.min(Number(req.query.limit || 15), 100);

    const whereClause = [where.replace(/^WHERE\s*/, "")].filter(Boolean);
    if (search) {
      whereClause.push("c.customerName LIKE ?");
      params.push(search);
    }

    const finalWhere = whereClause.length
      ? `WHERE ${whereClause.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
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
      LIMIT ?
      `,
      [...params, limit],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/top-products", async (req, res, next) => {
  try {
    const { where, params } = parseDateFilters(req.query);
    const search = req.query.q ? `%${req.query.q}%` : null;
    const limit = Math.min(Number(req.query.limit || 15), 100);

    const whereClause = [where.replace(/^WHERE\s*/, "")].filter(Boolean);
    if (search) {
      whereClause.push("(p.productName LIKE ? OR p.productLine LIKE ?)");
      params.push(search, search);
    }

    const finalWhere = whereClause.length
      ? `WHERE ${whereClause.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
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
      LIMIT ?
      `,
      [...params, limit],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/pivot", async (req, res, next) => {
  try {
    const rowKey = req.query.rows || "customer";
    const colKey = req.query.cols || "productLine";
    const metric = req.query.metric || "revenue";

    if (!DIMENSIONS[rowKey] || !DIMENSIONS[colKey]) {
      return res.status(400).json({
        error: "INVALID_DIMENSION",
        message:
          "rows/cols must be one of: customer, productLine, country, status, month",
      });
    }

    const metricExpr =
      metric === "qty"
        ? "COALESCE(SUM(od.quantityOrdered), 0)"
        : "COALESCE(SUM(od.quantityOrdered * od.priceEach), 0)";

    const { where, params } = parseDateFilters(req.query);

    const [rows] = await pool.query(
      `
      SELECT
        ${DIMENSIONS[rowKey]} AS rowKey,
        ${DIMENSIONS[colKey]} AS colKey,
        ${metricExpr} AS value
      FROM orders o
      JOIN customers c ON c.customerNumber = o.customerNumber
      JOIN orderdetails od ON od.orderNumber = o.orderNumber
      JOIN products p ON p.productCode = od.productCode
      ${where}
      GROUP BY rowKey, colKey
      ORDER BY rowKey, colKey
      `,
      params,
    );

    const rowSet = new Set();
    const colSet = new Set();
    rows.forEach((item) => {
      rowSet.add(item.rowKey || "(empty)");
      colSet.add(item.colKey || "(empty)");
    });

    const rowLabels = [...rowSet];
    const colLabels = [...colSet];
    const matrix = rowLabels.map(() => colLabels.map(() => 0));

    const rowIndex = new Map(rowLabels.map((k, i) => [k, i]));
    const colIndex = new Map(colLabels.map((k, i) => [k, i]));

    rows.forEach((item) => {
      const r = rowIndex.get(item.rowKey || "(empty)");
      const c = colIndex.get(item.colKey || "(empty)");
      matrix[r][c] = Number(item.value || 0);
    });

    res.json({ rowKey, colKey, metric, rowLabels, colLabels, matrix });
  } catch (error) {
    next(error);
  }
});

router.get("/search-orders", async (req, res, next) => {
  try {
    const { from, to, customer, product, limit } = req.query;
    const where = [];
    const params = [];

    if (from) {
      where.push("o.orderDate >= ?");
      params.push(from);
    }

    if (to) {
      where.push("o.orderDate <= ?");
      params.push(to);
    }

    if (customer) {
      where.push("c.customerName LIKE ?");
      params.push(`%${customer}%`);
    }

    if (product) {
      where.push("(p.productName LIKE ? OR p.productCode LIKE ?)");
      params.push(`%${product}%`, `%${product}%`);
    }

    const finalWhere = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const safeLimit = Math.min(Number(limit || 100), 1000);

    const [rows] = await pool.query(
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
      ${finalWhere}
      ORDER BY o.orderDate DESC, o.orderNumber DESC
      LIMIT ?
      `,
      [...params, safeLimit],
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
