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
    // Get the appropriate webhook URL based on developer
    const webhookUrl = bug.developer === 'astro'
        ? process.env.DISCORD_WEBHOOK_ASTRO
        : process.env.DISCORD_WEBHOOK_BUNGEE;

    if (!webhookUrl) {
        console.log(`Discord webhook not configured for ${bug.developer}`);
        return;
    }

    const classColor = CLASS_COLORS[bug.wow_class?.toLowerCase()] || 0xffd100;
    const priorityEmoji = PRIORITY_EMOJIS[bug.priority?.toLowerCase()] || "⚪";

    const embed = {
        title: `${priorityEmoji} New Bug Report: ${bug.title}`,
        color: classColor,
        fields: [
            {
                name: "📋 Class & Spec",
                value: `${capitalize(bug.wow_class)} - ${bug.rotation}`,
                inline: true,
            },
            {
                name: "🎮 Mode",
                value: `${bug.pvpve_mode?.toUpperCase()} | ${capitalize(bug.expansion)} | Lvl ${bug.level || '??'}`,
                inline: true,
            },
            {
                name: "⚠️ Priority",
                value: capitalize(bug.priority),
                inline: true,
            },
            {
                name: "🔴 Current Behavior",
                value: truncate(bug.current_behavior, 500),
                inline: false,
            },
            {
                name: "🟢 Expected Behavior",
                value: truncate(bug.expected_behavior, 500),
                inline: false,
            },
            {
                name: "👤 Reporter",
                value: `${bug.reporter_name}\n📱 Discord: ${bug.discord_username}\n🎮 Sylvanas: ${bug.sylvanas_username}`,
                inline: false,
            },
        ],
        footer: {
            text: `Assigned to: ${capitalize(bug.developer)} | Bungee × Astro Bug Tracker`,
        },
        timestamp: new Date().toISOString(),
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: "Bug Reporter",
                avatar_url: "https://raw.githubusercontent.com/badfloki-cmyk/azeroth-bug-tracker/main/public/bug-icon.png",
                embeds: [embed],
            }),
        });

        if (!response.ok) {
            console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`Discord notification sent for bug: ${bug.title}`);
        }
    } catch (error) {
        console.error('Error sending Discord notification:', error);
        // Don't throw - we don't want Discord failures to break bug creation
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
