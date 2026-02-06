import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/mongodb.js';
import Profile from '../../lib/models/Profile.js';
import { verifyToken, extractToken } from '../../lib/auth/jwt.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const token = extractToken(req.headers.authorization as string);
      if (!token) {
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
      }

      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Ungültiges Token' });
      }

      const profile = await Profile.findOne({ user_id: payload.id }).populate(
        'user_id'
      );

      if (!profile) {
        return res.status(404).json({ error: 'Profil nicht gefunden' });
      }

      return res.status(200).json(profile);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile error:', error);
    return res.status(500).json({
      error: 'Ein Fehler ist aufgetreten.',
      details: error.message
    });
  }
}
