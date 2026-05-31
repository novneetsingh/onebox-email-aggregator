import { Router } from "express";
import {
  getAccounts,
  connectGoogle,
  googleCallback,
  removeAccount,
} from "./accounts.controller";
import { protect } from "../../middleware/auth.middleware";

const accountsRouter = Router();

accountsRouter.use(protect);

// /api/v1/accounts
accountsRouter.get("/", getAccounts);

// /api/v1/accounts/google/connect
accountsRouter.get("/google/connect", connectGoogle);

// /api/v1/accounts/google/callback
accountsRouter.get("/google/callback", googleCallback);

// /api/v1/accounts/:id
accountsRouter.delete("/:id", removeAccount);

export default accountsRouter;
