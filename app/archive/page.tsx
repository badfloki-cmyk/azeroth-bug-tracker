"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { bugAPI } from "@/lib/api";
import { BugTicketList } from "@/components/BugTicketList";
import type { BugReport } from "@/components/BugReportModal";
import { Archive, Home, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function ArchivePage() {
    const { token } = useAuth();
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBugs();
    }, []);

    const fetchBugs = async () => {
        try {
            const data = await bugAPI.getAll();
            setBugs(data.map((bug: any) => ({
                id: bug._id,
                developer: bug.developer as 'astro' | 'bungee',
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
            })));
        } catch (error) {
            console.error("Error fetching bugs:", error);
            toast.error("Failed to load archived reports");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved', resolveReason?: string) => {
        if (!token) {
            toast.error("You must be logged in to change ticket status.");
            return;
        }
        try {
            await bugAPI.updateStatus(ticketId, newStatus, token, resolveReason);
            fetchBugs();
            toast.success(`Ticket moved to ${newStatus}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to update status");
        }
    };

    const archivedBugs = bugs.filter(b => b.isArchived);
    const astroBugs = archivedBugs.filter(b => b.developer === 'astro');
    const bungeeBugs = archivedBugs.filter(b => b.developer === 'bungee');

    return (
        <div className="min-h-screen relative">
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-border bg-card/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Archive className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                <div className="text-center md:text-left">
                                    <h1 className="font-display text-2xl md:text-4xl wow-gold-text tracking-wider">
                                        Archived Reports
                                    </h1>
                                    <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase mt-1">
                                        Resolved & Archived Bug Reports
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link href="/" className="wow-button flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span className="hidden md:inline">Main Page</span>
                                </Link>
                                <Link href="/auth" className="wow-button flex items-center gap-2">
                                    <LogIn className="w-4 h-4" />
                                    <span className="hidden md:inline">Developer Login</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="wow-gold-text font-display text-xl animate-pulse">
                                Loading Archived Reports...
                            </div>
                        </div>
                    ) : archivedBugs.length === 0 ? (
                        <div className="text-center py-12">
                            <Archive className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="font-display text-lg text-muted-foreground">No Archived Reports</h3>
                            <p className="text-sm text-muted-foreground/60 mt-2">
                                Resolved tickets will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8">
                            <BugTicketList
                                bugs={astroBugs}
                                title="Astro's Archived Reports"
                                isExpandable={true}
                                showActions={!!token}
                                onStatusChange={token ? handleStatusChange : undefined}
                                isArchiveView={true}
                            />
                            <BugTicketList
                                bugs={bungeeBugs}
                                title="Bungee's Archived Reports"
                                isExpandable={true}
                                showActions={!!token}
                                onStatusChange={token ? handleStatusChange : undefined}
                                isArchiveView={true}
                            />
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-12">
                    <div className="container mx-auto px-4 py-6 text-center">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            &copy; 2026 Bungee &times; Astro &bull; World of Warcraft Class Optimization Project
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
