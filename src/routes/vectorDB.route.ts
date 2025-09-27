import { Router, Request, Response } from "express";

import {
  insertEmbeddings,
  deleteEmbeddings,
} from "../services/vectorDB.service";

const router = Router();

// create embeddings
router.post("/create-embeddings", async (req: Request, res: Response) => {
  await insertEmbeddings();

  return res.status(201).json({
    success: true,
    message: "Embeddings created successfully",
  });
});

// delete embeddings
router.delete("/delete-embeddings", async (req: Request, res: Response) => {
  await deleteEmbeddings();

  return res.status(200).json({
    success: true,
    message: "Embeddings deleted successfully",
  });
});

export default router;
