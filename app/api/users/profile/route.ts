import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import Profile from 'lib/models/Profile';
import { verifyToken, extractToken } from 'lib/auth/jwt';

export async function GET(request: Request) {
    try {
        await connectDB();
        const token = extractToken(request.headers.get('authorization') || "");

        if (!token) {
            return NextResponse.json({ error: 'Authentifizierung erforderlich' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Ungültiges Token' }, { status: 401 });
        }

        const profile = await Profile.findOne({ user_id: payload.id }).populate('user_id');

        if (!profile) {
            return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        console.error('Profile error:', error);
        return NextResponse.json({
            error: 'Ein Fehler ist aufgetreten.',
            details: error.message
        }, { status: 500 });
    }
}
