import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import BugTicket from 'lib/models/BugTicket';
import { verifyToken, extractToken } from 'lib/auth/jwt';
import { sendBugNotification, sendResolvedNotification, updateDiscordNotification, deleteDiscordNotification } from 'lib/discord';

export async function GET() {
    try {
        await connectDB();
        const tickets = await BugTicket.find().sort({ createdAt: -1 });
        return NextResponse.json(tickets);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch tickets', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const authHeader = request.headers.get('authorization');
        let reporter_user_id = null;

        if (authHeader) {
            const token = extractToken(authHeader);
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
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (current_behavior.length < 50 || expected_behavior.length < 50) {
            return NextResponse.json({ error: 'Behavior descriptions must be at least 50 characters' }, { status: 400 });
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

        // Send Discord Notification and store message ID
        try {
            const messageId = await sendBugNotification(bugTicket);
            if (messageId) {
                bugTicket.discord_message_id = messageId;
                await bugTicket.save();
            }
        } catch (discordError) {
            console.error("Failed to send Discord notification:", discordError);
        }

        return NextResponse.json({ message: 'Bug Report successfully created!', ticket: bugTicket }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create bug report', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id, status, resolveReason } = body;
        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const updateData: Record<string, any> = { status };

        if (status === 'resolved') {
            updateData.isArchived = true;
            updateData.resolveReason = resolveReason || null;
        } else {
            updateData.isArchived = false;
            updateData.resolveReason = null;
        }

        const ticket = await BugTicket.findByIdAndUpdate(id, updateData, { new: true });
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Sync with Discord
        if (status === 'resolved') {
            try {
                // Send Archive Notification
                await sendResolvedNotification(ticket, resolveReason);
                // Delete original notification
                await deleteDiscordNotification(ticket);
            } catch (discordError) {
                console.error("Failed to sync Discord archive/delete:", discordError);
            }
        } else {
            try {
                // Update original notification status
                await updateDiscordNotification(ticket);
            } catch (discordError) {
                console.error("Failed to update Discord notification:", discordError);
            }
        }

        return NextResponse.json({ message: 'Status updated', ticket });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
        }

        const ticket = await BugTicket.findByIdAndUpdate(id, {
            isArchived: true,
            status: 'resolved'
        }, { new: true });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        // Sync with Discord
        try {
            await sendResolvedNotification(ticket, 'fixed');
            await deleteDiscordNotification(ticket);
        } catch (discordError) {
            console.error("Failed to sync Discord archive/delete:", discordError);
        }

        return NextResponse.json({ message: 'Ticket archived and resolved' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete ticket', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const { id, ...updateData } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
        }

        const ticket = await BugTicket.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Ticket updated', ticket });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update ticket', details: error.message }, { status: 500 });
    }
}
