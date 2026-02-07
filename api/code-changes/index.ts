import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/mongodb.js';
import CodeChange from '../../lib/models/CodeChange.js';
import Profile from '../../lib/models/Profile.js';
import User from '../../lib/models/User.js';
import BugTicket from '../../lib/models/BugTicket.js';
import { verifyToken, extractToken } from '../../lib/auth/jwt.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const changes = await CodeChange.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('developer_id', 'username developer_type')
        .populate('related_ticket_id');

      return res.status(200).json(changes);
    }

    if (req.method === 'POST') {
      const token = extractToken(req.headers.authorization as string);
      if (!token) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Ungültiges Token' });
      }

      const { file_path, change_description, change_type, related_ticket_id } =
        req.body;

      if (!file_path || !change_description || !change_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get profile to get developer_id
      const profile = await Profile.findOne({ user_id: payload.id });

      if (!profile) {
        return res.status(404).json({ error: 'Profil nicht gefunden' });
      }

      const cleanTicketId = (related_ticket_id && String(related_ticket_id).trim() !== "") ? related_ticket_id : null;

      const codeChange = new CodeChange({
        developer_id: profile._id,
        file_path,
        change_description,
        change_type,
        related_ticket_id: cleanTicketId,
      });

      await codeChange.save();
      await codeChange.populate('developer_id', 'username developer_type');

      return res.status(201).json({
        message: 'Code-Änderung protokolliert!',
        change: codeChange,
      });
    }

    if (req.method === 'DELETE') {
      const token = extractToken(req.headers.authorization as string);
      if (!token) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Ungültiges Token' });
      }

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing entry ID' });
      }

      const change = await CodeChange.findByIdAndDelete(id);

      if (!change) {
        return res.status(404).json({ error: 'Eintrag nicht gefunden' });
      }

      return res.status(200).json({ message: 'Eintrag gelöscht' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Code changes error:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten.',
      details: error.message
    });
  }
}
