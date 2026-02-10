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

/**
 * Send a Discord notification for a new bug report
 */
export async function sendBugNotification(bug: BugData): Promise<void> {
    console.log(`[Discord Webhook] Preparing notification for developer: "${bug.developer}"`);
    console.log(`[Discord Webhook] Bug Title: "${bug.title}"`);

    // Get the appropriate webhook URL based on developer
    const webhookAstro = process.env.DISCORD_WEBHOOK_ASTRO;
    const webhookBungee = process.env.DISCORD_WEBHOOK_BUNGEE;

    console.log(`[Discord Webhook] Env check - ASTRO: ${!!webhookAstro}, BUNGEE: ${!!webhookBungee}`);

    const webhookUrl = bug.developer === 'astro' ? webhookAstro : webhookBungee;

    if (!webhookUrl || webhookUrl.includes("YOUR_") || webhookUrl.length < 20) {
        console.error(`[Discord Webhook] ERROR: Valid Discord webhook URL NOT found for developer "${bug.developer}"`);
        console.log(`[Discord Webhook] Raw value: "${webhookUrl || 'undefined'}"`);
        return;
    }

    console.log(`[Discord Webhook] Using URL starting with: ${webhookUrl.substring(0, 35)}...`);

    const classColor = CLASS_COLORS[bug.wow_class?.toLowerCase()] || 0xffd100;
    const priorityEmoji = PRIORITY_EMOJIS[bug.priority?.toLowerCase()] || "⚪";

    // Format fields with safety checks
    const fields = [
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

    const payload = {
        username: "Bug Reporter",
        avatar_url: "https://raw.githubusercontent.com/badfloki-cmyk/azeroth-bug-tracker/main/public/bug-icon.png",
        embeds: [{
            title: `${priorityEmoji} New Bug Report: ${bug.title}`,
            color: classColor,
            fields: fields,
            footer: {
                text: `Assigned to: ${capitalize(bug.developer)} | Bungee × Astro Bug Tracker`,
            },
            timestamp: new Date().toISOString(),
        }],
    };

    try {
        console.log("[Discord Webhook] Sending fetch request...");
        const response = await fetch(webhookUrl.trim(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Discord Webhook] FAILED from Discord: ${response.status} ${response.statusText}`);
            console.error(`[Discord Webhook] Discord Error Body: ${errorText}`);
        } else {
            console.log(`[Discord Webhook] SUCCESS! Message delivered to Discord for: "${bug.title}"`);
        }
    } catch (error: any) {
        console.error('[Discord Webhook] CRITICAL ERROR during fetch:', error.message);
        if (error.stack) console.error(error.stack);
    }
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

function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

function truncate(str: string, maxLength: number): string {
    if (!str) return 'N/A';
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}
