import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import User from 'lib/models/User';
import Profile from 'lib/models/Profile';
import { generateToken } from 'lib/auth/jwt';

const ALLOWED_USERS = { bungee: 'bungee', astro: 'astro' };
const REGISTRATION_PASSWORD = 'gishlanepstein26$';

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { username, email, password, developer_type, registration_password } = body;

        if (!username || !email || !password || !developer_type || !registration_password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (registration_password !== REGISTRATION_PASSWORD) {
            return NextResponse.json({ error: 'Falsches Registrierungs-Passwort.' }, { status: 403 });
        }

        const lowerUsername = username.toLowerCase();
        if (!(lowerUsername in ALLOWED_USERS)) {
            return NextResponse.json({
                error: 'Diese Registrierung ist nicht erlaubt. Nur Bungee und Astro können sich registrieren.',
            }, { status: 403 });
        }

        if (lowerUsername !== developer_type.toLowerCase()) {
            return NextResponse.json({
                error: `Der Benutzername muss '${developer_type}' sein.`,
            }, { status: 400 });
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username: lowerUsername }],
        });

        if (existingUser) {
            return NextResponse.json({
                error: 'Diese E-Mail oder dieser Benutzername existiert bereits.',
            }, { status: 409 });
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

        return NextResponse.json({
            message: 'Registrierung erfolgreich!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                developer_type: user.developer_type,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({
            error: 'Ein Fehler ist aufgetreten.',
            details: error.message
        }, { status: 500 });
    }
}
