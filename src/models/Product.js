const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Product = sequelize.define(
  "products",
  {
    productCode: { type: DataTypes.STRING, primaryKey: true },
    productName: DataTypes.STRING,
    productLine: DataTypes.STRING,
  },
  { tableName: "products" },
);

module.exports = Product;
