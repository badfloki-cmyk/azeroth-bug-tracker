import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bugAPI } from '@/lib/api';
import type { BugReport } from '@/components/BugReportModal';

export const BUGS_QUERY_KEY = ['bugs'] as const;

function mapApiBug(bug: any): BugReport {
    return {
        id: bug._id,
        developer: (bug.developer as string || '').toLowerCase() as 'astro' | 'bungee',
        wowClass: bug.wow_class as BugReport['wowClass'],
        rotation: bug.rotation || '',
        pvpveMode: bug.pvpve_mode as 'pve' | 'pvp' || 'pve',
        level: bug.level || 80,
        expansion: bug.expansion as 'tbc' | 'era' | 'hc' || 'tbc',
        title: bug.title,
        description: bug.description,
        currentBehavior: bug.current_behavior || '',
        expectedBehavior: bug.expected_behavior || '',
        logs: bug.logs || undefined,
        videoUrl: bug.video_url || undefined,
        screenshotUrls: bug.screenshot_urls || [],
        discordUsername: bug.discord_username || '',
        sylvanasUsername: bug.sylvanas_username || '',
        priority: bug.priority as BugReport['priority'],
        status: bug.status as BugReport['status'],
        isArchived: bug.is_archived || bug.isArchived || false,
        resolveReason: bug.resolveReason || null,
        createdAt: new Date(bug.createdAt),
        reporter: bug.reporter_name || bug.sylvanas_username || '',
    };
}

export function useBugs() {
    const queryClient = useQueryClient();

    const {
        data: bugs = [],
        isLoading,
        error,
        refetch,
    } = useQuery<BugReport[]>({
        queryKey: BUGS_QUERY_KEY,
        queryFn: async () => {
            const data = await bugAPI.getAll();
            return data.map(mapApiBug);
        },
    });

    const createBug = useMutation({
        mutationFn: async ({ bug, token }: { bug: any; token: string }) => {
            return bugAPI.create(bug, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUGS_QUERY_KEY });
        },
    });

    const updateStatus = useMutation({
        mutationFn: async ({ ticketId, status, token, resolveReason }: { ticketId: string; status: string; token: string; resolveReason?: string }) => {
            return bugAPI.updateStatus(ticketId, status, token, resolveReason);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUGS_QUERY_KEY });
        },
    });

    const deleteBug = useMutation({
        mutationFn: async ({ ticketId, token }: { ticketId: string; token: string }) => {
            return bugAPI.delete(ticketId, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUGS_QUERY_KEY });
        },
    });

    const updateBug = useMutation({
        mutationFn: async ({ bug, token }: { bug: any; token: string }) => {
            return bugAPI.update(bug, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BUGS_QUERY_KEY });
        },
    });

    return {
        bugs,
        isLoading,
        error,
        refetch,
        createBug,
        updateStatus,
        deleteBug,
        updateBug,
    };
}
