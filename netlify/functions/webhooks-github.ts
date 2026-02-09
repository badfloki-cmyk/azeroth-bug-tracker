import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { connectDB } from '../../lib/db/mongodb';
import CodeChange, { ICodeChange } from '../../lib/models/CodeChange';
import Profile from '../../lib/models/Profile';

const verifySignature = (body: string, signature: string | undefined) => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('GITHUB_WEBHOOK_SECRET is not set');
        return false;
    }

    if (!signature) {
        return false;
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(body).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256, X-GitHub-Event',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const githubEvent = event.headers['x-github-event'];

    // Handle ping event
    if (githubEvent === 'ping') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Pong!' })
        };
    }

    // Verify signature
    const signature = event.headers['x-hub-signature-256'];
    if (!verifySignature(event.body || '', signature)) {
        return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid signature' })
        };
    }

    // Only process push events
    if (githubEvent !== 'push') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Ignored event type' })
        };
    }

    try {
        await connectDB();

        const payload = JSON.parse(event.body || '{}');
        const commits = payload.commits || [];
        const validProfiles = await Profile.find({});

        console.log(`Processing ${commits.length} commits from GitHub push`);

        const newChanges = [];

        for (const commit of commits) {
            const authorName = commit.author.name.toLowerCase();
            const authorUsername = commit.author.username?.toLowerCase() || '';
            const commitMessage = commit.message || '';

            // Skip merge commits
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

            // Determine Change Type
            let changeType: ICodeChange['change_type'] = 'update';
            const msgLower = commitMessage.toLowerCase();
            if (msgLower.includes('fix') || msgLower.includes('bug')) changeType = 'fix';
            else if (msgLower.includes('feat') || msgLower.includes('add') || msgLower.includes('new')) changeType = 'feature';
            else if (msgLower.includes('del') || msgLower.includes('remove')) changeType = 'delete';
            else if (msgLower.includes('create') || msgLower.includes('init')) changeType = 'create';

            // Determine File Path
            const distinctFiles = new Set([
                ...(commit.added || []),
                ...(commit.modified || []),
                ...(commit.removed || [])
            ]);

            const files = Array.from(distinctFiles);
            let filePathDisplay = 'Unknown file';
            if (files.length === 1) {
                filePathDisplay = files[0] as string;
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
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Processed push event',
                changes_created: newChanges.length
            })
        };

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
