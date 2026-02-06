import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/mongodb.js';
import User from '../../lib/models/User.js';
import Profile from '../../lib/models/Profile.js';
import { generateToken } from '../../lib/auth/jwt.js';

const ALLOWED_USERS = { bungee: 'bungee', astro: 'astro' };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    const { username, email, password, developer_type } = req.body;
    
    if (!username || !email || !password || !developer_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const lowerUsername = username.toLowerCase();
    if (!(lowerUsername in ALLOWED_USERS)) {
      return res.status(403).json({
        error: 'Diese Registrierung ist nicht erlaubt. Nur Bungee und Astro können sich registrieren.',
      });
    }
    
    if (lowerUsername !== developer_type.toLowerCase()) {
      return res.status(400).json({
        error: `Der Benutzername muss '${developer_type}' sein.`,
      });
    }
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username: lowerUsername }],
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Diese E-Mail oder dieser Benutzername existiert bereits.',
      });
    }
    
    const user = new User({
      username: lowerUsername,
      email,
      password,
      developer_type: developer_type.toLowerCase(),
    });
    await user.save();
    
    await Profile.create({
      user_id: user._id,
      username: user.username,
      developer_type: user.developer_type,
    });
    
    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      developer_type: user.developer_type,
    });
    
    return res.status(201).json({
      message: 'Registrierung erfolgreich!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        developer_type: user.developer_type,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Ein Fehler ist aufgetreten.' });
  }
}
