import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import CodeChange from "../../lib/models/CodeChange";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const changes = await CodeChange.find().sort({ createdAt: -1 }).limit(50).populate("developer_id", "username developer_type").populate("related_ticket_id");
      return res.status(200).json(changes);
    }
    if (req.method === "POST") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { file_path, change_description, change_type, related_ticket_id } = req.body;
      if (!file_path || !change_description || !change_type) return res.status(400).json({ error: "Missing required fields" });
      const codeChange = new CodeChange({ developer_id: payload.id, file_path, change_description, change_type, related_ticket_id: related_ticket_id || null });
      await codeChange.save();
      await codeChange.populate("developer_id", "username developer_type");
      return res.status(201).json({ message: "Code-Änderung protokolliert!", change: codeChange });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Code changes error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
