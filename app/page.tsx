"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { bugAPI } from "@/lib/api";
import { DeveloperCard } from "@/components/DeveloperCard";
import { BugReportModal, BugReport } from "@/components/BugReportModal";
import { BugTicketList } from "@/components/BugTicketList";
import { Shield, Swords, LogIn, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function IndexPage() {
    const [showBugModal, setShowBugModal] = useState<'astro' | 'bungee' | null>(null);
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
                createdAt: new Date(bug.createdAt),
                reporter: bug.reporter_name || bug.sylvanas_username || '',
            })));
        } catch (error) {
            console.error("Error fetching bugs:", error);
            toast.error("Failed to load bug reports");
        } finally {
            setLoading(false);
        }
    };

    const handleBugSubmit = async (bug: BugReport) => {
        try {
            await bugAPI.create({
                ...bug,
                developer: bug.developer,
                wow_class: bug.wowClass,
                pvpve_mode: bug.pvpveMode,
                current_behavior: bug.currentBehavior,
                expected_behavior: bug.expectedBehavior,
                discord_username: bug.discordUsername,
                sylvanas_username: bug.sylvanasUsername,
                reporter_name: bug.reporter,
                video_url: bug.videoUrl,
                screenshot_urls: bug.screenshotUrls,
            } as any, "");

            toast.success("Bug report created successfully!");
            fetchBugs();
        } catch (error: any) {
            toast.error(error.message || "Error creating bug report.");
            console.error(error);
        }
    };

    const handleBugDelete = async (ticketId: string) => {
        try {
            const token = localStorage.getItem('auth_token') || "";
            if (!token) {
                toast.error("You must be logged in to delete reports.");
                return;
            }
            await bugAPI.delete(ticketId, token);
            toast.success("Bug report archived successfully!");
            fetchBugs();
        } catch (error: any) {
            toast.error(error.message || "Error deleting bug report.");
            console.error(error);
        }
    };

    const visibleBugs = bugs.filter(b => !b.isArchived);
    const astroBugs = visibleBugs.filter(b => b.developer === 'astro');
    const bungeeBugs = visibleBugs.filter(b => b.developer === 'bungee');

    return (
        <div className="min-h-screen relative">
            {/* Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(/wow-background.jpg)` }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b border-border bg-card/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                                <div className="text-center md:text-left">
                                    <h1 className="font-display text-2xl md:text-4xl wow-gold-text tracking-wider">
                                        Bungee × Astro
                                    </h1>
                                    <p className="text-muted-foreground text-xs md:text-sm tracking-widest uppercase mt-1">
                                        Bug Reporter & Class Tracker
                                    </p>
                                </div>
                                <Swords className="w-10 h-10 text-primary hidden md:block" />
                            </div>

                            <Link
                                href="/auth"
                                className="wow-button flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                <span className="hidden md:inline">Developer Login</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {/* Donation Section - Prominent at Top */}
                    <div className="mb-8 text-center">
                        <a
                            href="https://revolut.me/mauromp4"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all group text-center"
                        >
                            <span className="font-display tracking-wide text-xs sm:text-sm md:text-base">If you want to support Bungee x Astro, tips are appreciated</span>
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                    </div>

                    {/* Developer Cards */}
                    <div className="grid lg:grid-cols-2 gap-8 mb-12">
                        <DeveloperCard
                            developer="astro"
                            onReportBug={() => setShowBugModal('astro')}
                        />
                        <DeveloperCard
                            developer="bungee"
                            onReportBug={() => setShowBugModal('bungee')}
                        />
                    </div>

                    {/* Bug Reports Section */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="wow-gold-text font-display text-xl animate-pulse">
                                Loading Bug Reports...
                            </div>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-8">
                            <BugTicketList
                                bugs={astroBugs}
                                title="Astro's Bug Reports"
                                isExpandable={false}
                                onDelete={handleBugDelete}
                            />
                            <BugTicketList
                                bugs={bungeeBugs}
                                title="Bungee's Bug Reports"
                                isExpandable={false}
                                onDelete={handleBugDelete}
                            />
                        </div>
                    )}

                </main>

                {/* Footer */}
                <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-12">
                    <div className="container mx-auto px-4 py-6 text-center">
                        <p className="text-muted-foreground text-xs sm:text-sm">
                            © 2026 Bungee × Astro • World of Warcraft Class Optimization Project
                        </p>
                    </div>
                </footer>
            </div>

            {/* Bug Report Modal */}
            {showBugModal && (
                <BugReportModal
                    developer={showBugModal}
                    onClose={() => setShowBugModal(null)}
                    onSubmit={handleBugSubmit}
                />
            )}
        </div>
    );
}
