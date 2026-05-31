import { Router } from "express";
import { listEmails, search, getEmail, deleteEmail } from "./emails.controller";
import { protect } from "../../middleware/auth.middleware";

const emailsRouter = Router();

emailsRouter.use(protect);

// /api/v1/emails
emailsRouter.get("/", listEmails);

// /api/v1/emails/search
emailsRouter.get("/search", search);

// /api/v1/emails/:id
emailsRouter.get("/:id", getEmail);

// /api/v1/emails/:id
emailsRouter.delete("/:id", deleteEmail);

export default emailsRouter;
