import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import BugTicket from "../../lib/models/BugTicket";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const tickets = await BugTicket.find().sort({ createdAt: -1 });
      return res.status(200).json(tickets);
    }
    if (req.method === "POST") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { developer, wow_class, rotation, pvpve_mode, level, expansion, title, description, current_behavior, expected_behavior, logs, video_url, screenshot_urls, discord_username, sylvanas_username, priority, reporter_name } = req.body;
      if (!developer || !wow_class || !rotation || !pvpve_mode || !title || !current_behavior || !expected_behavior || !discord_username || !sylvanas_username || !reporter_name) return res.status(400).json({ error: "Missing required fields" });
      if (current_behavior.length < 200) return res.status(400).json({ error: "Current behavior must be at least 200 characters" });
      if (expected_behavior.length < 200) return res.status(400).json({ error: "Expected behavior must be at least 200 characters" });
      const bugTicket = new BugTicket({ developer, wow_class, rotation, pvpve_mode, level, expansion, title, description: current_behavior, current_behavior, expected_behavior, logs: logs || null, video_url: video_url || null, screenshot_urls: screenshot_urls || [], discord_username, sylvanas_username, priority: priority || "medium", status: "open", reporter_name, reporter_user_id: payload.id });
      await bugTicket.save();
      return res.status(201).json({ message: "Bug Report erfolgreich erstellt!", ticket: bugTicket });
    }
    if (req.method === "PATCH") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { id, status } = req.body;
      if (!id || !status) return res.status(400).json({ error: "ID und Status erforderlich" });
      const bugTicket = await BugTicket.findByIdAndUpdate(id, { status }, { new: true });
      if (!bugTicket) return res.status(404).json({ error: "Bug Ticket nicht gefunden" });
      return res.status(200).json({ message: "Status aktualisiert!", ticket: bugTicket });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Bug tickets error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
