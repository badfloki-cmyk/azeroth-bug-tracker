import express from 'express';
import crypto from 'crypto';
import CodeChange, { ICodeChange } from '../../lib/models/CodeChange.js';
import Profile from '../../lib/models/Profile.js';

// Extend Request to include rawBody
interface RequestWithRawBody extends express.Request {
    rawBody?: Buffer;
}

const verifySignature = (req: RequestWithRawBody) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('GITHUB_WEBHOOK_SECRET is not set');
        return false;
    }

    if (!signature || !req.rawBody) {
        return false;
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export default async function handler(req: RequestWithRawBody, res: express.Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // specific check for ping events
    const event = req.headers['x-github-event'];
    if (event === 'ping') {
        return res.status(200).json({ message: 'Pong!' });
    }

    if (!verifySignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    if (event !== 'push') {
        // We only care about push events for now
        return res.status(200).json({ message: 'Ignored event type' });
    }

    try {
        const payload = req.body;
        const commits = payload.commits || [];
        const validProfiles = await Profile.find({}); // Fetch all profiles for matching

        console.log(`Processing ${commits.length} commits from GitHub push`);

        const newChanges = [];

        for (const commit of commits) {
            // Identify Developer
            // Strategy: Check if commit author name/username matches known developer names
            // This is a simple heuristic. In production, we might map GitHub login explicitly.

            const authorName = commit.author.name.toLowerCase();
            const authorUsername = commit.author.username?.toLowerCase() || '';
            const commitMessage = commit.message || '';

            // Skip merge commits if desired, but maybe keeping them is fine for history
            if (commitMessage.startsWith('Merge branch')) continue;

            let matchedProfile = null;

            // Simple keyword matching for our specific team
            // "Active" profiles: Bungee, Astro
            // We iterate through available profiles to find a match
            for (const profile of validProfiles) {
                const pName = profile.username.toLowerCase();
                const pType = profile.developer_type; // 'astro' or 'bungee'

                // Check strict or loose equality
                // If the profile username is part of the commit author, or vice versa
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
            // Accessing added/modified/removed arrays
            const distinctFiles = new Set([
                ...(commit.added || []),
                ...(commit.modified || []),
                ...(commit.removed || [])
            ]);

            // Heuristic for file_path:
            // If 1 file, use it.
            // If multiple, use "Multiple files (n)" or first file + "..."
            const files = Array.from(distinctFiles);
            let filePathDisplay = 'Unknown file';
            if (files.length === 1) {
                filePathDisplay = files[0];
            } else if (files.length > 1) {
                // Try to find a common path or just say "Multiple files"
                filePathDisplay = `Multiple files (${files.length})`;
                // Optional: list first 2
                // filePathDisplay = `${files[0]}, ${files[1]}...`; 
            }

            const codeChange = new CodeChange({
                developer_id: matchedProfile._id,
                file_path: filePathDisplay,
                change_description: commitMessage, // Use full commit message
                change_type: changeType,
                related_ticket_id: null // We could parse #123 here if needed later
            });

            await codeChange.save();
            newChanges.push(codeChange);
        }

        console.log(`Created ${newChanges.length} code change entries.`);
        return res.status(200).json({
            message: 'Processed push event',
            changes_created: newChanges.length
        });

    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
