import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/mongodb.js';
import User from '../../lib/models/User.js';
import { generateToken } from '../../lib/auth/jwt.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await connectDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const token = generateToken({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      developer_type: user.developer_type,
    });
    
    return res.status(200).json({
      message: 'Willkommen zurück, Held!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        developer_type: user.developer_type,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Ein Fehler ist aufgetreten.' });
  }
}
