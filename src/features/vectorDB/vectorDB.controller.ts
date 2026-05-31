import { Request, Response } from "express";
import { insertEmbeddings, deleteEmbeddings } from "./vectorDB.service";

/**
 * @route POST /api/v1/vector/create-embeddings
 * Generates vector embeddings for stored emails to enable semantic search capabilities.
 */
export const createEmbeddings = async (_req: Request, res: Response) => {
  await insertEmbeddings();
  res
    .status(201)
    .json({ success: true, message: "Embeddings created successfully" });
};

/**
 * @route DELETE /api/v1/vector/delete-embeddings
 * Removes generated vector embeddings from the vector database to free up space or reset search data.
 */
export const removeEmbeddings = async (_req: Request, res: Response) => {
  await deleteEmbeddings();
  res.json({ success: true, message: "Embeddings deleted successfully" });
};
