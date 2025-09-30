import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config({ debug: true });
import cors from "cors";
import { accounts } from "./config/imapAccounts";
import { startImap } from "./services/imap.service";
import { checkEsConnection } from "./config/elasticsearch";
import ErrorResponse from "./utils/errorResponse";
import emailRoutes from "./routes/email.route";
import vectorDBRoutes from "./routes/vectorDB.route";
import { startWorkers } from "./services/workers.service";

const app: Application = express();

app.use(express.json());
app.use(cors());

// start workers
startWorkers();

// // Check Elasticsearch connection
checkEsConnection();

// Start IMAP for all accounts
(async () => {
  for (const account of accounts) {
    startImap(account).catch((err) => console.error(err));
  }
})();

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Onebox Email Aggregator server");
});

// routes
app.use("/email", emailRoutes);
app.use("/vectordb", vectorDBRoutes);

// global error handling middleware
app.use(
  (err: ErrorResponse, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
