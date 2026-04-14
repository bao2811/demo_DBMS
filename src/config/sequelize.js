const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "classicmodels",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "bao12345",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  },
);

module.exports = sequelize;
