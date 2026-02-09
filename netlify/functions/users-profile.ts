import { Handler } from '@netlify/functions';
import { connectDB } from '../../lib/db/mongodb';
import Profile from '../../lib/models/Profile';
import User from '../../lib/models/User';
import { verifyToken, extractToken } from '../../lib/auth/jwt';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        await connectDB();

        const authHeader = event.headers.authorization || event.headers.Authorization;
        const token = extractToken(authHeader as string);
        if (!token) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Authentifizierung erforderlich' })
            };
        }

        const payload = verifyToken(token);
        if (!payload) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Ungültiges Token' })
            };
        }

        const profile = await Profile.findOne({ user_id: payload.id }).populate('user_id');

        if (!profile) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Profil nicht gefunden' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(profile)
        };
    } catch (error: any) {
        console.error('Profile error:', error);
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
