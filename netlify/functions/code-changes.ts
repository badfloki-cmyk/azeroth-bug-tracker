import { Handler } from '@netlify/functions';
import { connectDB } from '../../lib/db/mongodb';
import CodeChange from '../../lib/models/CodeChange';
import Profile from '../../lib/models/Profile';
import BugTicket from '../../lib/models/BugTicket';
import { verifyToken, extractToken } from '../../lib/auth/jwt';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await connectDB();

        // GET - List all code changes
        if (event.httpMethod === 'GET') {
            const changes = await CodeChange.find()
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('developer_id', 'username developer_type')
                .populate('related_ticket_id');

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(changes)
            };
        }

        // POST - Create new code change
        if (event.httpMethod === 'POST') {
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

            const body = JSON.parse(event.body || '{}');
            const { file_path, change_description, change_type, related_ticket_id, github_url } = body;

            if (!file_path || !change_description || !change_type) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            const profile = await Profile.findOne({ user_id: payload.id });

            if (!profile) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Profil nicht gefunden' })
                };
            }

            const cleanTicketId = (related_ticket_id && String(related_ticket_id).trim() !== "") ? related_ticket_id : null;

            const codeChange = new CodeChange({
                developer_id: profile._id,
                file_path,
                change_description,
                change_type,
                related_ticket_id: cleanTicketId,
                github_url: github_url || null,
            });

            await codeChange.save();
            await codeChange.populate('developer_id', 'username developer_type');

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'Code-Änderung protokolliert!',
                    change: codeChange,
                })
            };
        }

        // DELETE - Delete code change
        if (event.httpMethod === 'DELETE') {
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

            const body = JSON.parse(event.body || '{}');
            const { id } = body;
            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing entry ID' })
                };
            }

            const change = await CodeChange.findByIdAndDelete(id);

            if (!change) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Eintrag nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Eintrag gelöscht' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (error: any) {
        console.error('Code changes error:', error);
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
