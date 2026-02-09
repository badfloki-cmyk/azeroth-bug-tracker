"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { userAPI, bugAPI, codeChangeAPI } from "@/lib/api";
import { WoWPanel } from "@/components/WoWPanel";
import { BugTicketList } from "@/components/BugTicketList";
import { CodeChangeTracker } from "@/components/CodeChangeTracker";
import { BugStats } from "@/components/BugStats";
import { LogOut, Shield, Swords, Home, Archive } from "lucide-react";
import { toast } from "sonner";
import { BugReportModal } from "@/components/BugReportModal";
import type { BugReport } from "@/components/BugReportModal";

interface Profile {
    id: string;
    username: string;
    developer_type: 'astro' | 'bungee' | null;
    avatar_url: string | null;
}

interface CodeChange {
    id: string;
    developer_id: string;
    file_path: string;
    change_description: string;
    change_type: 'create' | 'update' | 'delete' | 'fix' | 'feature';
    related_ticket_id: string | null;
    github_url?: string;
    created_at: string;
}

export default function DashboardPage() {
    const { user, token, logout, isLoading: authLoading } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [codeChanges, setCodeChanges] = useState<CodeChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBug, setEditingBug] = useState<BugReport | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth");
        } else if (user && token) {
            loadDashboardData();
        }
    }, [user, token, authLoading, router]);

    const loadDashboardData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            // Fetch profile
            const profileData = await userAPI.getProfile(token);
            const devType = (profileData.developer_type || profileData.user_id?.developer_type || "").toLowerCase();

            setProfile({
                id: profileData._id,
                username: profileData.username,
                developer_type: devType as 'astro' | 'bungee' | null,
                avatar_url: profileData.avatar_url
            });

            // Fetch bugs
            const bugsData = await bugAPI.getAll();
            setBugs(bugsData.map((bug: any) => ({
                id: bug._id,
                developer: (bug.developer as string || "").toLowerCase() as 'astro' | 'bungee',
                wowClass: bug.wow_class as BugReport['wowClass'],
                rotation: bug.rotation,
                pvpveMode: bug.pvpve_mode as BugReport['pvpveMode'],
                level: bug.level,
                expansion: bug.expansion as BugReport['expansion'],
                title: bug.title,
                description: bug.description,
                currentBehavior: bug.current_behavior,
                expectedBehavior: bug.expected_behavior,
                logs: bug.logs,
                videoUrl: bug.video_url,
                screenshotUrls: bug.screenshot_urls || [],
                discordUsername: bug.discord_username,
                sylvanasUsername: bug.sylvanas_username,
                priority: bug.priority as BugReport['priority'],
                status: bug.status as BugReport['status'],
                isArchived: bug.is_archived || bug.isArchived || false,
                createdAt: new Date(bug.createdAt),
                reporter: bug.reporter_name || bug.sylvanas_username || 'Unknown',
                resolveReason: bug.resolveReason || null,
            })));

            // Fetch code changes
            const changesData = await codeChangeAPI.getAll();
            setCodeChanges(changesData.map((change: any) => ({
                id: change._id,
                developer_id: change.developer_id?._id || change.developer_id,
                file_path: change.file_path,
                change_description: change.change_description,
                change_type: change.change_type,
                related_ticket_id: change.related_ticket_id?._id || change.related_ticket_id,
                github_url: change.github_url,
                created_at: change.createdAt || new Date().toISOString()
            })));
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        toast.success("Goodbye, Hero!");
        router.push("/");
    };

    const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved', resolveReason?: string) => {
        if (!token) return;
        try {
            await bugAPI.updateStatus(ticketId, newStatus, token, resolveReason);
            setBugs(bugs.map(b => b.id === ticketId ? {
                ...b,
                status: newStatus,
                isArchived: newStatus === 'resolved',
                resolveReason: newStatus === 'resolved' ? (resolveReason || null) : null,
            } : b));
            toast.success(`Status updated to ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const handleDeleteBug = async (ticketId: string) => {
        if (!token) return;
        if (!window.confirm("Are you sure you want to delete this bug report? It will be archived and counted as resolved.")) return;

        try {
            await bugAPI.delete(ticketId, token);
            setBugs(bugs.map(b => b.id === ticketId ? { ...b, isArchived: true, status: 'resolved' } : b));
            toast.success("Bug report archived and resolved.");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete bug report");
        }
    };

    const handleEditBug = (bug: BugReport) => {
        setEditingBug(bug);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (updatedBug: BugReport) => {
        if (!token) return;
        try {
            // Map frontend fields to backend fields
            const backendBug = {
                id: updatedBug.id,
                developer: updatedBug.developer,
                wow_class: updatedBug.wowClass,
                rotation: updatedBug.rotation,
                pvpve_mode: updatedBug.pvpveMode,
                level: updatedBug.level,
                expansion: updatedBug.expansion,
                title: updatedBug.title,
                description: updatedBug.description,
                current_behavior: updatedBug.currentBehavior,
                expected_behavior: updatedBug.expectedBehavior,
                logs: updatedBug.logs,
                video_url: updatedBug.videoUrl,
                screenshot_urls: updatedBug.screenshotUrls,
                discord_username: updatedBug.discordUsername,
                sylvanas_username: updatedBug.sylvanasUsername,
                priority: updatedBug.priority,
                status: updatedBug.status
            };

            await bugAPI.update(backendBug as any, token);
            toast.success("Bug report updated!");
            setIsEditModalOpen(false);
            setEditingBug(null);
            loadDashboardData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update bug report");
        }
    };

    const handleAddCodeChange = async (filePath: string, description: string, type: CodeChange['change_type'], ticketId?: string, githubUrl?: string) => {
        if (!token || !profile) return;
        try {
            await codeChangeAPI.create({
                file_path: filePath,
                change_description: description,
                change_type: type,
                related_ticket_id: ticketId && ticketId.trim() !== "" ? ticketId : undefined,
                github_url: githubUrl
            }, token);
            toast.success("Code change logged!");
            loadDashboardData();
        } catch (error: any) {
            toast.error(error.message || "Error saving change");
        }
    };

    const handleDeleteChange = async (changeId: string) => {
        if (!token) return;
        if (!window.confirm("Are you sure you want to delete this code change entry?")) return;

        try {
            await codeChangeAPI.delete(changeId, token);
            setCodeChanges(codeChanges.filter(c => c.id !== changeId));
            toast.success("Code change entry deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete code change");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <WoWPanel className="max-w-xs w-full text-center">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                    <h2 className="font-display text-xl wow-gold-text">Loading Dashboard...</h2>
                </WoWPanel>
            </div>
        );
    }

    // Filter visible bugs (not archived)
    const visibleBugs = bugs.filter(b => !b.isArchived);
    const myBugs = visibleBugs.filter(b => b.developer === profile?.developer_type);
    const otherBugs = visibleBugs.filter(b => b.developer !== profile?.developer_type);

    return (
        <div className="min-h-screen relative bg-background/95">
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Swords className="w-6 h-6 text-primary" />
                        <h1 className="font-display text-lg wow-gold-text hidden sm:block">Developer Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-border">
                            <div className="text-right hidden xs:block">
                                <p className="text-sm font-display leading-tight">{profile?.username}</p>
                                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">
                                    {profile?.developer_type} Developer
                                </p>
                            </div>
                            <img
                                src={profile?.developer_type === 'astro' ? "/astro-avatar.png" : "/bungee-avatar.png"}
                                alt="Avatar"
                                className="w-10 h-10 rounded-sm border border-primary/50 bg-black/50"
                            />
                        </div>

                        <button
                            onClick={() => router.push("/")}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                            title="Back to Main Page"
                        >
                            <Home className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => router.push("/archive")}
                            className="p-2 text-muted-foreground hover:text-primary transition-colors"
                            title="View Archived Tickets"
                        >
                            <Archive className="w-5 h-5" />
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 py-8 relative z-10">
                {/* Statistics Section */}
                <div className="mb-8">
                    <BugStats bugs={bugs} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column - Bug Tickets */}
                    <div className="lg:col-span-2 space-y-8">
                        <BugTicketList
                            bugs={myBugs}
                            title={`My Bug Tickets (${profile?.developer_type})`}
                            showActions={true}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteBug}
                            onEdit={handleEditBug}
                        />

                        <BugTicketList
                            bugs={otherBugs}
                            title="Other Bug Tickets"
                            showActions={true}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteBug}
                            onEdit={handleEditBug}
                        />
                    </div>

                    {/* Sidebar - Code Activity */}
                    <div className="space-y-8">
                        <div className="lg:sticky lg:top-24">
                            <CodeChangeTracker
                                changes={codeChanges}
                                bugs={bugs}
                                onAddChange={handleAddCodeChange}
                                onDelete={handleDeleteChange}
                                currentDeveloperId={profile?.id}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            {isEditModalOpen && editingBug && (
                <BugReportModal
                    developer={editingBug.developer}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingBug(null);
                    }}
                    onSubmit={handleEditSubmit}
                    initialBug={editingBug}
                />
            )}
        </div>
    );
}
