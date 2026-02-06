import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperCard } from "@/components/DeveloperCard";
import { BugReportModal, BugReport } from "@/components/BugReportModal";
import { BugTicketList } from "@/components/BugTicketList";
import { Shield, Swords, LogIn } from "lucide-react";
import wowBackground from "@/assets/wow-background.jpg";
import { toast } from "sonner";

const Index = () => {
  const [showBugModal, setShowBugModal] = useState<'astro' | 'bungee' | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBugs();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('public-bugs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bug_tickets' },
        () => {
          fetchBugs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBugs = async () => {
    const { data, error } = await supabase
      .from('bug_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching bugs:", error);
    } else if (data) {
      setBugs(data.map(bug => ({
        id: bug.id,
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
        createdAt: new Date(bug.created_at),
        reporter: bug.reporter_name || bug.sylvanas_username || '',
      })));
    }
    setLoading(false);
  };

  const handleBugSubmit = async (bug: BugReport) => {
    const { error } = await supabase
      .from('bug_tickets')
      .insert({
        developer: bug.developer,
        wow_class: bug.wowClass,
        rotation: bug.rotation,
        pvpve_mode: bug.pvpveMode,
        level: bug.level,
        expansion: bug.expansion,
        title: bug.title,
        description: bug.description,
        current_behavior: bug.currentBehavior,
        expected_behavior: bug.expectedBehavior,
        logs: bug.logs || null,
        video_url: bug.videoUrl || null,
        screenshot_urls: bug.screenshotUrls || [],
        discord_username: bug.discordUsername,
        sylvanas_username: bug.sylvanasUsername,
        priority: bug.priority,
        status: 'open',
        reporter_name: bug.reporter,
      });

    if (error) {
      toast.error("Error creating bug report");
      console.error(error);
    } else {
      toast.success("Bug report created successfully!");
    }
  };

  const astroBugs = bugs.filter(b => b.developer === 'astro');
  const bungeeBugs = bugs.filter(b => b.developer === 'bungee');

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${wowBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-10 h-10 text-primary" />
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
                to="/auth"
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
              />
              <BugTicketList 
                bugs={bungeeBugs} 
                title="Bungee's Bug Reports" 
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-12">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-muted-foreground text-sm">
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
};

export default Index;
