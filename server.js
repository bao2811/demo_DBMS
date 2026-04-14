require("dotenv").config();

const express = require("express");
const path = require("path");
const { sequelize } = require("./src/models");
const apiV1Routes = require("./src/routes/apiV1");

const app = express();
const basePort = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/v1", apiV1Routes);

const uiRoutes = ["/", "/dashboard", "/reports", "/search", "/assistant"];
app.get(uiRoutes, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "classicmodels-analytics" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: err.message || "Unexpected error",
  });
});

function startServer(startPort, maxTries = 10) {
  let tries = 0;
  let currentPort = startPort;

  const server = app.listen(currentPort, () => {
    console.log(`Server is running at http://localhost:${currentPort}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && tries < maxTries) {
      tries += 1;
      currentPort += 1;
      console.warn(
        `Port ${currentPort - 1} is in use. Retrying on port ${currentPort}...`,
      );
      startServer(currentPort, maxTries - tries);
      return;
    }

    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established via Sequelize ORM.");
    startServer(basePort);
  } catch (error) {
    console.error("Unable to connect to database:", error.message);
    process.exit(1);
  }
}

bootstrap();
