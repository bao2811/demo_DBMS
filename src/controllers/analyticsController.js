const analyticsService = require("../services/analyticsService");

function handleError(res, error) {
  if (error.message === "INVALID_DIMENSION") {
    return res.status(400).json({
      error: "INVALID_DIMENSION",
      message:
        "rows/cols must be one of: customer, productLine, country, status, month",
    });
  }

  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: error.message || "Unexpected error",
  });
}

async function getSummary(req, res) {
  try {
    const data = await analyticsService.getSummary(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

async function getSalesOverTime(req, res) {
  try {
    const data = await analyticsService.getSalesOverTime(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

async function getTopCustomers(req, res) {
  try {
    const data = await analyticsService.getTopCustomers(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

async function getTopProducts(req, res) {
  try {
    const data = await analyticsService.getTopProducts(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

async function getPivot(req, res) {
  try {
    const data = await analyticsService.getPivot(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

async function listOrders(req, res) {
  try {
    const data = await analyticsService.searchOrders(req.query);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  getSummary,
  getSalesOverTime,
  getTopCustomers,
  getTopProducts,
  getPivot,
  listOrders,
};
