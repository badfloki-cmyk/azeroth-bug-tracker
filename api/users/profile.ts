import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import Profile from "../../lib/models/Profile";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDB();
    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
    const profile = await Profile.findOne({ user_id: payload.id });
    if (!profile) return res.status(404).json({ error: "Profil nicht gefunden" });
    return res.status(200).json({ id: profile._id, user_id: profile.user_id, username: profile.username, developer_type: profile.developer_type, avatar_url: profile.avatar_url });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
