import { Handler } from '@netlify/functions';
import { connectDB } from '../../lib/db/mongodb';
import User from '../../lib/models/User';
import Profile from '../../lib/models/Profile';
import { generateToken } from '../../lib/auth/jwt';

const ALLOWED_USERS = { bungee: 'bungee', astro: 'astro' };
const REGISTRATION_PASSWORD = 'gishlanepstein26$';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        await connectDB();
        const body = JSON.parse(event.body || '{}');
        const { username, email, password, developer_type, registration_password } = body;

        if (!username || !email || !password || !developer_type || !registration_password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        if (registration_password !== REGISTRATION_PASSWORD) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Falsches Registrierungs-Passwort.' })
            };
        }

        const lowerUsername = username.toLowerCase();
        if (!(lowerUsername in ALLOWED_USERS)) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Diese Registrierung ist nicht erlaubt. Nur Bungee und Astro können sich registrieren.' })
            };
        }

        if (lowerUsername !== developer_type.toLowerCase()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: `Der Benutzername muss '${developer_type}' sein.` })
            };
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username: lowerUsername }],
        });

        if (existingUser) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'Diese E-Mail oder dieser Benutzername existiert bereits.' })
            };
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

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Registrierung erfolgreich!',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    developer_type: user.developer_type,
                },
            })
        };
    } catch (error: any) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Ein Fehler ist aufgetreten.',
                details: error.message
            })
        };
    }
};
