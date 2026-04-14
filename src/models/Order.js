const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Order = sequelize.define(
  "orders",
  {
    orderNumber: { type: DataTypes.INTEGER, primaryKey: true },
    orderDate: DataTypes.DATEONLY,
    status: DataTypes.STRING,
    customerNumber: DataTypes.INTEGER,
  },
  { tableName: "orders" },
);

module.exports = Order;
