const express = require("express");
const analyticsController = require("../controllers/analyticsController");

const router = express.Router();

router.get("/analytics/summary", analyticsController.getSummary);
router.get("/analytics/sales", analyticsController.getSalesOverTime);
router.get("/customers/top", analyticsController.getTopCustomers);
router.get("/products/top", analyticsController.getTopProducts);
router.get("/reports/pivot", analyticsController.getPivot);
router.get("/orders", analyticsController.listOrders);

module.exports = router;
