/**
 * Discord Webhook Integration
 * Sends notifications to Discord when new bugs are reported
 * Supports separate channels for Astro and Bungee bugs
 */

interface BugData {
    developer: 'astro' | 'bungee';
    wow_class: string;
    rotation: string;
    title: string;
    current_behavior: string;
    expected_behavior: string;
    priority: string;
    discord_username: string;
    sylvanas_username: string;
    reporter_name: string;
    expansion: string;
    pvpve_mode: string;
    level?: number;
}

// WoW class colors for embeds
const CLASS_COLORS: Record<string, number> = {
    warrior: 0xc79c6e,
    paladin: 0xf58cba,
    hunter: 0xabd473,
    rogue: 0xfff569,
    priest: 0xffffff,
    shaman: 0x0070de,
    mage: 0x69ccf0,
    warlock: 0x9482c9,
    druid: 0xff7d0a,
    "death-knight": 0xc41f3b,
};

const PRIORITY_EMOJIS: Record<string, string> = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
};

const DEVELOPER_PINGS: Record<string, string> = {
    astro: "<@173179043598827522>",
    bungee: "<@260411245000261632>",
};

/**
 * Send a Discord notification for a new bug report
 * Returns the message ID if successful
 */
export async function sendBugNotification(bug: BugData): Promise<string | null> {
    console.log(`[Discord Webhook] Preparing notification for developer: "${bug.developer}"`);
    console.log(`[Discord Webhook] Bug Title: "${bug.title}"`);

    const webhookAstro = process.env.DISCORD_WEBHOOK_ASTRO;
    const webhookBungee = process.env.DISCORD_WEBHOOK_BUNGEE;

    const webhookUrl = bug.developer === 'astro' ? webhookAstro : webhookBungee;

    if (!webhookUrl || webhookUrl.includes("YOUR_") || webhookUrl.length < 20) {
        console.error(`[Discord Webhook] ERROR: Valid Discord webhook URL NOT found for developer "${bug.developer}"`);
        return null;
    }

    const classColor = CLASS_COLORS[bug.wow_class?.toLowerCase()] || 0xffd100;
    const priorityEmoji = PRIORITY_EMOJIS[bug.priority?.toLowerCase()] || "⚪";

    const payload = {
        username: "Bug Reporter",
        avatar_url: "https://raw.githubusercontent.com/badfloki-cmyk/azeroth-bug-tracker/main/public/bug-icon.png",
        content: DEVELOPER_PINGS[bug.developer?.toLowerCase()] || "",
        embeds: [{
            title: `${priorityEmoji} New Bug Report: ${bug.title}`,
            color: classColor,
            fields: formatBugFields(bug),
            footer: {
                text: `Status: Open | Assigned to: ${capitalize(bug.developer)} | Bungee × Astro Bug Tracker`,
            },
            timestamp: new Date().toISOString(),
        }],
    };

    try {
        const response = await fetch(`${webhookUrl.trim()}?wait=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Discord Webhook] FAILED: ${response.status} ${errorText}`);
            return null;
        }

        const data = await response.json();
        console.log(`[Discord Webhook] SUCCESS! Message ID: ${data.id}`);
        return data.id;
    } catch (error: any) {
        console.error('[Discord Webhook] CRITICAL ERROR:', error.message);
        return null;
    }
}

/**
 * Update an existing Discord notification with new status
 */
export async function updateDiscordNotification(bug: any): Promise<void> {
    if (!bug.discord_message_id) return;

    const webhookUrl = bug.developer === 'astro'
        ? process.env.DISCORD_WEBHOOK_ASTRO
        : process.env.DISCORD_WEBHOOK_BUNGEE;

    if (!webhookUrl) return;

    const priorityEmoji = PRIORITY_EMOJIS[bug.priority?.toLowerCase()] || "⚪";
    const statusText = bug.status === 'in-progress' ? "In Progress ⚙️" : capitalize(bug.status);

    const payload = {
        embeds: [{
            title: `${priorityEmoji} Bug Report: ${bug.title}`,
            color: bug.status === 'in-progress' ? 0x3498db : (CLASS_COLORS[bug.wow_class?.toLowerCase()] || 0xffd100),
            fields: formatBugFields({
                ...bug.toObject(),
                wow_class: bug.wow_class,
                rotation: bug.rotation,
                pvpve_mode: bug.pvpve_mode,
                expansion: bug.expansion,
                level: bug.level,
                priority: bug.priority,
                reporter_name: bug.reporter_name,
                discord_username: bug.discord_username,
                sylvanas_username: bug.sylvanas_username,
                current_behavior: bug.current_behavior,
                expected_behavior: bug.expected_behavior
            }),
            footer: {
                text: `Status: ${statusText} | Assigned to: ${capitalize(bug.developer)} | Bungee × Astro Bug Tracker`,
            },
            timestamp: bug.createdAt.toISOString(),
        }],
    };

    try {
        await fetch(`${webhookUrl.trim()}/messages/${bug.discord_message_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        console.log(`[Discord Sync] Updated notification for "${bug.title}"`);
    } catch (error: any) {
        console.error('[Discord Sync] ERROR updating notification:', error.message);
    }
}

/**
 * Delete an existing Discord notification (usually when resolved/archived)
 */
export async function deleteDiscordNotification(bug: any): Promise<void> {
    if (!bug.discord_message_id) return;

    const webhookUrl = bug.developer === 'astro'
        ? process.env.DISCORD_WEBHOOK_ASTRO
        : process.env.DISCORD_WEBHOOK_BUNGEE;

    if (!webhookUrl) return;

    try {
        await fetch(`${webhookUrl.trim()}/messages/${bug.discord_message_id}`, {
            method: 'DELETE',
        });
        console.log(`[Discord Sync] Deleted original notification for "${bug.title}"`);
    } catch (error: any) {
        console.error('[Discord Sync] ERROR deleting notification:', error.message);
    }
}

function formatBugFields(bug: any) {
    return [
        {
            name: "📋 Class & Spec",
            value: `${capitalize(bug.wow_class)} - ${bug.rotation || 'N/A'}`,
            inline: true,
        },
        {
            name: "🎮 Mode",
            value: `${bug.pvpve_mode?.toUpperCase() || 'N/A'} | ${capitalize(bug.expansion)} | Lvl ${bug.level || '??'}`,
            inline: true,
        },
        {
            name: "⚠️ Priority",
            value: capitalize(bug.priority),
            inline: true,
        },
        {
            name: "🔴 Current Behavior",
            value: truncate(bug.current_behavior, 400),
            inline: false,
        },
        {
            name: "🟢 Expected Behavior",
            value: truncate(bug.expected_behavior, 400),
            inline: false,
        },
        {
            name: "👤 Reporter",
            value: `${bug.reporter_name || 'Anonymous'}\n📱 Discord: ${bug.discord_username || 'N/A'}\n🎮 Sylvanas: ${bug.sylvanas_username || 'N/A'}`,
            inline: false,
        },
    ];
}

/**
 * Send a Discord notification for a resolved bug report
 */
export async function sendResolvedNotification(bug: any, resolveReason?: string): Promise<void> {
    console.log(`[Discord Archiving] Preparing resolved notification for developer: "${bug.developer}"`);

    const webhookAstroArchive = process.env.DISCORD_WEBHOOK_ASTRO_ARCHIVE;
    const webhookBungeeArchive = process.env.DISCORD_WEBHOOK_BUNGEE_ARCHIVE;

    const webhookUrl = bug.developer === 'astro' ? webhookAstroArchive : webhookBungeeArchive;

    if (!webhookUrl || webhookUrl.includes("YOUR_") || webhookUrl.length < 20) {
        console.error(`[Discord Archiving] ERROR: Valid Discord archive webhook URL NOT found for developer "${bug.developer}"`);
        return;
    }

    const classColor = CLASS_COLORS[bug.wow_class?.toLowerCase()] || 0xffd100;

    const fields = [
        {
            name: "📋 Class & Spec",
            value: `${capitalize(bug.wow_class)} - ${bug.rotation || 'N/A'}`,
            inline: true,
        },
        {
            name: "🎮 Mode",
            value: `${bug.pvpve_mode?.toUpperCase() || 'N/A'} | ${capitalize(bug.expansion)}`,
            inline: true,
        },
        {
            name: "✅ Resolution",
            value: resolveReason ? (REASON_LABELS[resolveReason] || capitalize(resolveReason)) : "Resolved",
            inline: true,
        },
        {
            name: "🔴 Bug Description",
            value: truncate(bug.description || bug.current_behavior, 400),
            inline: false,
        },
        {
            name: "👤 Original Reporter",
            value: `${bug.reporter_name || 'Anonymous'}\n📱 Discord: ${bug.discord_username || 'N/A'}`,
            inline: false,
        },
    ];

    const payload = {
        username: "Bug Archiver",
        avatar_url: "https://raw.githubusercontent.com/badfloki-cmyk/azeroth-bug-tracker/main/public/bug-icon.png",
        embeds: [{
            title: `✅ Bug Resolved & Archived: ${bug.title}`,
            color: 0x43b581, // Discord Green
            fields: fields,
            footer: {
                text: `Developer: ${capitalize(bug.developer)} | Archiving System`,
            },
            timestamp: new Date().toISOString(),
        }],
    };

    try {
        await fetch(webhookUrl.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        console.log(`[Discord Archiving] SUCCESS! Bug "${bug.title}" archived to Discord.`);
    } catch (error: any) {
        console.error('[Discord Archiving] ERROR sending archive notification:', error.message);
    }
}

const REASON_LABELS: Record<string, string> = {
    'no_response': "User didn't respond",
    'not_reproducible': "Couldn't replicate",
    'user_side': "User side problem",
    'fixed': "Fixed / Implemented",
};

/**
 * Send a Discord notification for a new feature request
 * Returns the message ID if successful
 */
export async function sendFeatureRequestNotification(feature: any): Promise<string | null> {
    const webhookAstro = process.env.DISCORD_WEBHOOK_ASTRO_FEATURES;
    const webhookBungee = process.env.DISCORD_WEBHOOK_BUNGEE_FEATURES;

    const webhookUrl = feature.developer === 'astro' ? webhookAstro : webhookBungee;

    if (!webhookUrl || webhookUrl.includes("YOUR_") || webhookUrl.length < 20) {
        console.error(`[Discord Features] ERROR: Valid Discord webhook URL NOT found for developer "${feature.developer}"`);
        return null;
    }

    const payload = {
        username: "Feature Request Bot",
        avatar_url: "https://raw.githubusercontent.com/badfloki-cmyk/azeroth-bug-tracker/main/public/feature-icon.png",
        embeds: [{
            title: `💡 New Feature Request: ${feature.title}`,
            color: 0x3498db, // Business Blue
            fields: [
                { name: "👤 Requester", value: feature.reporter_name || feature.discord_username, inline: true },
                { name: "🏷 Category", value: capitalize(feature.category), inline: true },
                { name: "🎮 Developer", value: capitalize(feature.developer), inline: true },
                { name: "📝 Description", value: truncate(feature.description, 1000), inline: false },
                { name: "📱 Discord", value: feature.discord_username, inline: true },
                { name: "🎮 Sylvanas", value: feature.sylvanas_username, inline: true },
            ],
            footer: {
                text: `Status: Open | Bungee × Astro Feature Tracker`,
            },
            timestamp: new Date().toISOString(),
        }],
        components: [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 3, // Success (Green)
                        label: "Accept",
                        custom_id: `feature_accept_${feature._id}`,
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger (Red)
                        label: "Reject",
                        custom_id: `feature_reject_${feature._id}`,
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(`${webhookUrl.trim()}?wait=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Discord Features] FAILED: ${response.status} ${errorText}`);
            return null;
        }

        const data = await response.json();
        return data.id;
    } catch (error: any) {
        console.error('[Discord Features] CRITICAL ERROR:', error.message);
        return null;
    }
}

/**
 * Update a feature request notification status
 */
export async function updateFeatureRequestNotification(feature: any): Promise<void> {
    if (!feature.discord_message_id) return;

    const webhookUrl = feature.developer === 'astro'
        ? process.env.DISCORD_WEBHOOK_ASTRO_FEATURES
        : process.env.DISCORD_WEBHOOK_BUNGEE_FEATURES;

    if (!webhookUrl) return;

    const statusColors = {
        open: 0x3498db,
        accepted: 0x2ecc71,
        rejected: 0xe74c3c
    };

    const payload = {
        embeds: [{
            title: `${feature.status === 'accepted' ? '✅' : feature.status === 'rejected' ? '❌' : '💡'} Feature Request: ${feature.title}`,
            color: statusColors[feature.status as keyof typeof statusColors] || 0x3498db,
            fields: [
                { name: "👤 Requester", value: feature.discord_username, inline: true },
                { name: "🏷 Category", value: capitalize(feature.category), inline: true },
                { name: "🎮 Developer", value: capitalize(feature.developer), inline: true },
                { name: "📝 Description", value: truncate(feature.description, 1000), inline: false },
                { name: "📱 Discord", value: feature.discord_username, inline: true },
                { name: "🎮 Sylvanas", value: feature.sylvanas_username, inline: true },
            ],
            footer: {
                text: `Status: ${capitalize(feature.status)} | Bungee × Astro Feature Tracker`,
            },
            timestamp: new Date(feature.createdAt).toISOString(),
        }],
        components: [] // Remove buttons after status is decided
    };

    try {
        await fetch(`${webhookUrl.trim()}/messages/${feature.discord_message_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (error: any) {
        console.error('[Discord Sync] ERROR updating feature notification:', error.message);
    }
}

function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

function truncate(str: string, maxLength: number): string {
    if (!str) return 'N/A';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}
