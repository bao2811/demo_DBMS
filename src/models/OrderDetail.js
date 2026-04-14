const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const OrderDetail = sequelize.define(
  "orderdetails",
  {
    orderNumber: { type: DataTypes.INTEGER, primaryKey: true },
    productCode: { type: DataTypes.STRING, primaryKey: true },
    quantityOrdered: DataTypes.INTEGER,
    priceEach: DataTypes.DECIMAL(10, 2),
    orderLineNumber: DataTypes.INTEGER,
  },
  { tableName: "orderdetails" },
);

module.exports = OrderDetail;
