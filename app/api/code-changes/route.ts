import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import CodeChange from 'lib/models/CodeChange';
import Profile from 'lib/models/Profile';
import { verifyToken, extractToken } from 'lib/auth/jwt';

export async function GET() {
    try {
        await connectDB();
        const changes = await CodeChange.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('developer_id', 'username developer_type')
            .populate('related_ticket_id');

        return NextResponse.json(changes);
    } catch (error: any) {
        console.error('Code changes error:', error);
        return NextResponse.json({ error: 'Failed to fetch code changes', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token) {
            return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 });
        }

        const { file_path, change_description, change_type, related_ticket_id, github_url } = body;

        if (!file_path || !change_description || !change_type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const profile = await Profile.findOne({ user_id: payload.id });
        if (!profile) {
            return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
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

        // Send Discord Notification
        try {
            const webhookUrl = profile.developer_type === 'astro'
                ? process.env.DISCORD_WEBHOOK_ASTRO
                : process.env.DISCORD_WEBHOOK_BUNGEE;

            if (webhookUrl) {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        embeds: [{
                            title: `📂 Code Change: ${file_path}`,
                            color: 10181046, // Purple-ish
                            description: change_description,
                            fields: [
                                { name: 'Type', value: change_type.toUpperCase(), inline: true },
                                { name: 'Developer', value: profile.username, inline: true },
                                { name: 'GitHub URL', value: github_url ? `[Link](${github_url})` : 'N/A', inline: true }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: { text: 'Azeroth Bug Tracker - Code Tracker' }
                        }]
                    })
                });
            }
        } catch (discordError) {
            console.error("Failed to send Discord notification for code change:", discordError);
        }

        return NextResponse.json({ message: 'Code-Änderung protokolliert!', change: codeChange }, { status: 201 });
    } catch (error: any) {
        console.error('Code changes error:', error);
        return NextResponse.json({ error: 'Failed to create code change', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token || !verifyToken(token)) {
            return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
        }

        const { id } = body;
        if (!id) {
            return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
        }

        const change = await CodeChange.findByIdAndDelete(id);
        if (!change) {
            return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Eintrag gelöscht' });
    } catch (error: any) {
        console.error('Code changes error:', error);
        return NextResponse.json({ error: 'Failed to delete code change', details: error.message }, { status: 500 });
    }
}
