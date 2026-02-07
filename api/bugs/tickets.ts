import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/mongodb.js';
import BugTicket from '../../lib/models/BugTicket.js';
import { verifyToken, extractToken } from '../../lib/auth/jwt.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const tickets = await BugTicket.find().sort({ createdAt: -1 });
      return res.status(200).json(tickets);
    }

    if (req.method === 'POST') {
      const authHeader = req.headers.authorization;
      let reporter_user_id = null;

      if (authHeader) {
        const token = extractToken(authHeader as string);
        if (token) {
          const payload = verifyToken(token);
          if (payload) {
            reporter_user_id = payload.id;
          }
        }
      }

      const {
        developer,
        wow_class,
        rotation,
        pvpve_mode,
        level,
        expansion,
        title,
        description,
        current_behavior,
        expected_behavior,
        logs,
        video_url,
        screenshot_urls,
        discord_username,
        sylvanas_username,
        priority,
        reporter_name,
      } = req.body;

      if (
        !developer ||
        !wow_class ||
        !rotation ||
        !pvpve_mode ||
        !title ||
        !current_behavior ||
        !expected_behavior ||
        !discord_username ||
        !sylvanas_username ||
        !reporter_name ||
        !expansion ||
        !logs
      ) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (current_behavior.length < 50) {
        return res.status(400).json({
          error: 'Current behavior must be at least 50 characters',
        });
      }

      if (expected_behavior.length < 50) {
        return res.status(400).json({
          error: 'Expected behavior must be at least 50 characters',
        });
      }

      const bugTicket = new BugTicket({
        developer,
        wow_class,
        rotation,
        pvpve_mode,
        level,
        expansion,
        title,
        description: current_behavior,
        current_behavior,
        expected_behavior,
        logs: logs || null,
        video_url: video_url || null,
        screenshot_urls: screenshot_urls || [],
        discord_username,
        sylvanas_username,
        priority: priority || 'medium',
        status: 'open',
        reporter_name,
        reporter_user_id,
      });

      await bugTicket.save();
      return res.status(201).json({
        message: 'Bug Report erfolgreich erstellt!',
        ticket: bugTicket,
      });
    }

    if (req.method === 'PATCH') {
      const token = extractToken(req.headers.authorization as string);
      if (!token) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Ungültiges Token' });
      }

      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const ticket = await BugTicket.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket nicht gefunden' });
      }

      return res.status(200).json({ message: 'Status aktualisiert', ticket });
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
        return res.status(400).json({ error: 'Missing ticket ID' });
      }

      const ticket = await BugTicket.findByIdAndDelete(id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket nicht gefunden' });
      }

      return res.status(200).json({ message: 'Ticket gelöscht' });
    }

    if (req.method === 'PUT') {
      const token = extractToken(req.headers.authorization as string);
      if (!token) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Ungültiges Token' });
      }

      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing ticket ID' });
      }

      const ticket = await BugTicket.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket nicht gefunden' });
      }

      return res.status(200).json({ message: 'Ticket aktualisiert', ticket });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Bug tickets error:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten.',
      details: error.message
    });
  }
}
