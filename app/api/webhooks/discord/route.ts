import { NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import { connectDB } from 'lib/db/mongodb';
import FeatureRequest from 'lib/models/FeatureRequest';
import { updateFeatureRequestNotification } from 'lib/discord';

export async function POST(request: Request) {
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const bodyText = await request.text();

    console.log('[Discord Webhook] Received request');

    if (!signature || !timestamp) {
        console.error('[Discord Webhook] Missing signature headers');
        return new Response('Missing signature headers', { status: 401 });
    }

    if (!PUBLIC_KEY) {
        console.error('[Discord Webhook] DISCORD_PUBLIC_KEY not set in environment variables');
        return new Response('Configuration error', { status: 500 });
    }

    // Verify signature
    try {
        const encoder = new TextEncoder();
        const isVerified = nacl.sign.detached.verify(
            encoder.encode(timestamp + bodyText),
            Buffer.from(signature, 'hex'),
            Buffer.from(PUBLIC_KEY, 'hex')
        );

        if (!isVerified) {
            console.error('[Discord Webhook] Invalid request signature');
            return new Response('Invalid request signature', { status: 401 });
        }
    } catch (err) {
        console.error('[Discord Webhook] Signature verification error:', err);
        return new Response('Invalid request signature', { status: 401 });
    }

    const body = JSON.parse(bodyText);

    // Handle Ping
    if (body.type === 1) {
        return NextResponse.json({ type: 1 });
    }

    // Handle Component Interaction (Buttons)
    if (body.type === 3) {
        const customId = body.data.custom_id;

        if (customId.startsWith('feature_')) {
            await connectDB();

            const parts = customId.split('_');
            const action = parts[1]; // 'accept' or 'reject'
            const featureId = parts[2];

            const status = action === 'accept' ? 'accepted' : 'rejected';

            const feature = await FeatureRequest.findByIdAndUpdate(featureId, { status }, { new: true });

            if (feature) {
                // Update the Discord message to show the new status and remove buttons
                await updateFeatureRequestNotification(feature);

                return NextResponse.json({
                    type: 4, // Respond with channel message
                    data: {
                        content: `Feature request "${feature.title}" has been ${status} by <@${body.member.user.id}>.`,
                        flags: 64 // Ephemeral
                    }
                });
            }
        }
    }

    return NextResponse.json({ error: 'Unknown interaction' }, { status: 400 });
}
