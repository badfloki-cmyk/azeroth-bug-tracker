import { Handler } from '@netlify/functions';
import { connectDB } from '../../lib/db/mongodb';
import User from '../../lib/models/User';
import { generateToken } from '../../lib/auth/jwt';

export const handler: Handler = async (event) => {
    // CORS headers
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
        const { identifier, email: emailFallback, password } = body;
        const loginId = identifier || emailFallback;

        if (!loginId || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'E-Mail/Username und Passwort erforderlich' })
            };
        }

        const query = loginId.includes('@')
            ? { email: loginId.toLowerCase() }
            : { username: loginId.toLowerCase() };
        const user = await User.findOne(query);

        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
            };
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
            };
        }

        const token = generateToken({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            developer_type: user.developer_type,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Willkommen zurück, Held!',
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
        console.error('Login error:', error);
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
