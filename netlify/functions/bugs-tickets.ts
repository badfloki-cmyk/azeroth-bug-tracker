import { Handler } from '@netlify/functions';
import { connectDB } from '../../lib/db/mongodb';
import BugTicket from '../../lib/models/BugTicket';
import { verifyToken, extractToken } from '../../lib/auth/jwt';
import { sendBugNotification } from '../../lib/discord';

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await connectDB();

        // GET - List all tickets
        if (event.httpMethod === 'GET') {
            const tickets = await BugTicket.find().sort({ createdAt: -1 });
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(tickets)
            };
        }

        // POST - Create new ticket
        if (event.httpMethod === 'POST') {
            const authHeader = event.headers.authorization || event.headers.Authorization;
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

            const body = JSON.parse(event.body || '{}');
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
            } = body;

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
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            if (current_behavior.length < 50) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Current behavior must be at least 50 characters' })
                };
            }

            if (expected_behavior.length < 50) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Expected behavior must be at least 50 characters' })
                };
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

            // Send Discord notification (non-blocking)
            sendBugNotification({
                developer: developer.toLowerCase(),
                wow_class,
                rotation,
                title,
                current_behavior,
                expected_behavior,
                priority: priority || 'medium',
                discord_username,
                sylvanas_username,
                reporter_name,
                expansion,
                pvpve_mode,
                level,
            }).catch(err => console.error('Discord notification error:', err));

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'Bug Report erfolgreich erstellt!',
                    ticket: bugTicket,
                })
            };
        }

        // PATCH - Update ticket status
        if (event.httpMethod === 'PATCH') {
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
            const { id, status } = body;
            if (!id || !status) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }

            const ticket = await BugTicket.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );

            if (!ticket) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Ticket nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Status aktualisiert', ticket })
            };
        }

        // DELETE - Delete ticket
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
                    body: JSON.stringify({ error: 'Missing ticket ID' })
                };
            }

            const ticket = await BugTicket.findByIdAndDelete(id);

            if (!ticket) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Ticket nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Ticket gelöscht' })
            };
        }

        // PUT - Update entire ticket
        if (event.httpMethod === 'PUT') {
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
            const { id, ...updateData } = body;
            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing ticket ID' })
                };
            }

            const ticket = await BugTicket.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true }
            );

            if (!ticket) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Ticket nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Ticket aktualisiert', ticket })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    } catch (error: any) {
        console.error('Bug tickets error:', error);
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
