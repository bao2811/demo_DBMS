const sequelize = require("../config/sequelize");
const Customer = require("./Customer");
const Order = require("./Order");
const OrderDetail = require("./OrderDetail");
const Product = require("./Product");

Customer.hasMany(Order, { foreignKey: "customerNumber" });
Order.belongsTo(Customer, { foreignKey: "customerNumber" });

Order.hasMany(OrderDetail, { foreignKey: "orderNumber" });
OrderDetail.belongsTo(Order, { foreignKey: "orderNumber" });

Product.hasMany(OrderDetail, { foreignKey: "productCode" });
OrderDetail.belongsTo(Product, { foreignKey: "productCode" });

module.exports = {
  sequelize,
  Customer,
  Order,
  OrderDetail,
  Product,
};
