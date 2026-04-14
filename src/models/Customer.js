const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Customer = sequelize.define(
  "customers",
  {
    customerNumber: { type: DataTypes.INTEGER, primaryKey: true },
    customerName: DataTypes.STRING,
    country: DataTypes.STRING,
  },
  { tableName: "customers" },
);

module.exports = Customer;
