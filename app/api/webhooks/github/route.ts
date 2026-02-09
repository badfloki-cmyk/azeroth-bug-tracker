import { NextResponse } from 'next/server';
import crypto from 'crypto';
import CodeChange, { ICodeChange } from 'lib/models/CodeChange';
import Profile from 'lib/models/Profile';
import { connectDB } from 'lib/db/mongodb';

const verifySignature = (body: string, signature: string | null) => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('GITHUB_WEBHOOK_SECRET is not set');
        return false;
    }

    if (!signature || !body) {
        return false;
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(body).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export async function POST(request: Request) {
    try {
        await connectDB();

        const event = request.headers.get('x-github-event');
        const signature = request.headers.get('x-hub-signature-256');

        const rawBody = await request.text();

        if (event === 'ping') {
            return NextResponse.json({ message: 'Pong!' });
        }

        if (!verifySignature(rawBody, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        if (event !== 'push') {
            return NextResponse.json({ message: 'Ignored event type' });
        }

        const payload = JSON.parse(rawBody);
        const commits = payload.commits || [];
        const validProfiles = await Profile.find({});

        console.log(`Processing ${commits.length} commits from GitHub push`);

        const newChanges = [];

        for (const commit of commits) {
            const authorName = commit.author.name.toLowerCase();
            const authorUsername = commit.author.username?.toLowerCase() || '';
            const commitMessage = commit.message || '';

            if (commitMessage.startsWith('Merge branch')) continue;

            let matchedProfile = null;

            for (const profile of validProfiles) {
                const pName = profile.username.toLowerCase();
                const pType = profile.developer_type;

                if (authorName.includes(pName) || authorUsername.includes(pName) ||
                    (pType === 'astro' && (authorName.includes('astro') || authorName.includes('mauro'))) ||
                    (pType === 'bungee' && (authorName.includes('bungee') || authorName.includes('raggy')))) {
                    matchedProfile = profile;
                    break;
                }
            }

            if (!matchedProfile) {
                console.log(`Skipping commit ${commit.id}: No matching developer profile found for ${commit.author.name}`);
                continue;
            }

            let changeType: ICodeChange['change_type'] = 'update';
            const msgLower = commitMessage.toLowerCase();
            if (msgLower.includes('fix') || msgLower.includes('bug')) changeType = 'fix';
            else if (msgLower.includes('feat') || msgLower.includes('add') || msgLower.includes('new')) changeType = 'feature';
            else if (msgLower.includes('del') || msgLower.includes('remove')) changeType = 'delete';
            else if (msgLower.includes('create') || msgLower.includes('init')) changeType = 'create';

            const distinctFiles = new Set([
                ...(commit.added || []),
                ...(commit.modified || []),
                ...(commit.removed || [])
            ]);

            const files = Array.from(distinctFiles);
            let filePathDisplay = 'Unknown file';
            if (files.length === 1) {
                filePathDisplay = files[0];
            } else if (files.length > 1) {
                filePathDisplay = `Multiple files (${files.length})`;
            }

            const codeChange = new CodeChange({
                developer_id: matchedProfile._id,
                file_path: filePathDisplay,
                change_description: commitMessage,
                change_type: changeType,
                related_ticket_id: null
            });

            await codeChange.save();
            newChanges.push(codeChange);
        }

        console.log(`Created ${newChanges.length} code change entries.`);
        return NextResponse.json({
            message: 'Processed push event',
            changes_created: newChanges.length
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
