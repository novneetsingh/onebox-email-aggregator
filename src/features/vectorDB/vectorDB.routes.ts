import { Router } from "express";
import { createEmbeddings, removeEmbeddings } from "./vectorDB.controller";

const vectorDBRouter = Router();

// /api/v1/vector/create-embeddings
vectorDBRouter.post("/create-embeddings", createEmbeddings);

// /api/v1/vector/delete-embeddings
vectorDBRouter.delete("/delete-embeddings", removeEmbeddings);

export default vectorDBRouter;
