import { useState, useEffect } from 'react';

export type DiscordStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface LanyardData {
    discord_status: DiscordStatus;
    activities: {
        name: string;
        type: number;
        details?: string;
        state?: string;
    }[];
    discord_user: {
        username: string;
        discriminator: string;
        avatar: string;
    };
}

export const useDiscordStatus = (userId: string) => {
    const [status, setStatus] = useState<DiscordStatus>('offline');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LanyardData | null>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchStatus = async () => {
            try {
                const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
                const json = await response.json();
                if (json.success) {
                    setStatus(json.data.discord_status);
                    setData(json.data);
                }
            } catch (err) {
                console.error(`Error fetching Discord status for ${userId}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [userId]);

    return { status, loading, data };
};
