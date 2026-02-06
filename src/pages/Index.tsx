import { useState } from "react";
import { DeveloperCard } from "@/components/DeveloperCard";
import { BugReportModal, BugReport } from "@/components/BugReportModal";
import { BugTicketList } from "@/components/BugTicketList";
import { Shield, Swords } from "lucide-react";
import wowBackground from "@/assets/wow-background.jpg";

const Index = () => {
  const [showBugModal, setShowBugModal] = useState<'astro' | 'bungee' | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([
    // Demo bugs
    {
      id: '1',
      developer: 'astro',
      wowClass: 'rogue',
      title: 'Stealth breaks randomly in combat',
      description: 'When using Vanish during combat, sometimes the stealth effect breaks immediately without any visible damage source.',
      priority: 'high',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000),
      reporter: 'ShadowDancer',
    },
    {
      id: '2',
      developer: 'bungee',
      wowClass: 'mage',
      title: 'Pyroblast not critting with Hot Streak',
      description: 'Hot Streak procs but Pyroblast sometimes fails to crit as expected. Happens approximately 1 in 10 casts.',
      priority: 'medium',
      status: 'in-progress',
      createdAt: new Date(Date.now() - 7200000),
      reporter: 'FireMaster',
    },
  ]);

  const handleBugSubmit = (bug: BugReport) => {
    setBugs([bug, ...bugs]);
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
            <div className="flex items-center justify-center gap-4">
              <Shield className="w-10 h-10 text-primary" />
              <div className="text-center">
                <h1 className="font-display text-3xl md:text-4xl wow-gold-text tracking-wider">
                  Bungee × Astro
                </h1>
                <p className="text-muted-foreground text-sm tracking-widest uppercase mt-1">
                  Bug Reporter & Class Tracker
                </p>
              </div>
              <Swords className="w-10 h-10 text-primary" />
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
