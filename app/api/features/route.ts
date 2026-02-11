import { NextResponse } from 'next/server';
import { connectDB } from 'lib/db/mongodb';
import FeatureRequest from 'lib/models/FeatureRequest';
import { sendFeatureRequestNotification } from 'lib/discord';
import { verifyToken, extractToken } from 'lib/auth/jwt';

export async function GET() {
    try {
        await connectDB();
        const features = await FeatureRequest.find().sort({ createdAt: -1 });
        return NextResponse.json(features);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch feature requests', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        const {
            developer,
            category,
            wow_class,
            title,
            description,
            discord_username,
            sylvanas_username,
        } = body;

        if (
            !developer ||
            !category ||
            !title ||
            !description ||
            !discord_username ||
            !sylvanas_username
        ) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const featureRequest = new FeatureRequest({
            developer,
            category,
            wow_class: wow_class || null,
            title,
            description,
            discord_username,
            sylvanas_username,
            status: 'open',
        });

        await featureRequest.save();

        // Send Discord Notification and store message ID
        try {
            const messageId = await sendFeatureRequestNotification(featureRequest);
            if (messageId) {
                featureRequest.discord_message_id = messageId;
                await featureRequest.save();
            }
        } catch (discordError) {
            console.error("Failed to send Discord notification for feature:", discordError);
        }

        return NextResponse.json({ message: 'Feature Request successfully created!', feature: featureRequest }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create feature request', details: error.message }, { status: 500 });
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

        const { id, status } = body;
        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const feature = await FeatureRequest.findByIdAndUpdate(id, { status }, { new: true });
        if (!feature) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        // Sync with Discord will be handled here if needed (e.g. from dashboard change)
        // For now, assume Discord sync is handled via updateFeatureRequestNotification
        const { updateFeatureRequestNotification } = await import('lib/discord');
        await updateFeatureRequestNotification(feature);

        return NextResponse.json({ message: 'Status updated', feature });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update feature', details: error.message }, { status: 500 });
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
            return NextResponse.json({ error: 'Missing feature ID' }, { status: 400 });
        }

        const feature = await FeatureRequest.findByIdAndDelete(id);
        if (!feature) {
            return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Feature request deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete feature request', details: error.message }, { status: 500 });
    }
}
