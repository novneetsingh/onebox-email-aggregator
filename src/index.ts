import express, { Application, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { accounts } from "./config/imap";
import { startImap } from "./services/imap.service";
import { checkEsConnection } from "./config/elasticsearch";
import ErrorResponse from "./utils/errorResponse";

const app: Application = express();

app.use(express.json());
app.use(cors());

// Start IMAP for all accounts
// (async () => {
//   for (const account of accounts) {
//     startImap(account).catch((err) => console.error(err));
//   }
// })();

// Check Elasticsearch connection
checkEsConnection();

app.get("/", (req, res) => {
  res.send("Onebox Email Aggregator");
});

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

app.listen(process.env.PORT || 4000, () => {
  console.log(`Server started on port ${process.env.PORT || 4000}`);
});
