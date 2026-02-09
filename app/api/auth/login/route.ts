import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import User from 'lib/models/User';
import { generateToken } from 'lib/auth/jwt';

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { identifier, email: emailFallback, password } = body;
        const loginId = identifier || emailFallback;

        if (!loginId || !password) {
            return NextResponse.json({ error: 'E-Mail/Username und Passwort erforderlich' }, { status: 400 });
        }

        const query = loginId.includes('@')
            ? { email: loginId.toLowerCase() }
            : { username: loginId.toLowerCase() };

        const user = await User.findOne(query);
        if (!user) {
            return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
        }

        const token = generateToken({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            developer_type: user.developer_type,
        });

        return NextResponse.json({
            message: 'Willkommen zurück, Held!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                developer_type: user.developer_type,
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({
            error: 'Ein Fehler ist aufgetreten.',
            details: error.message
        }, { status: 500 });
    }
}
