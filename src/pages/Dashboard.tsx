import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WoWPanel } from "@/components/WoWPanel";
import { BugTicketList } from "@/components/BugTicketList";
import { CodeChangeTracker } from "@/components/CodeChangeTracker";
import { LogOut, Shield, Swords, Plus, User } from "lucide-react";
import wowBackground from "@/assets/wow-background.jpg";
import astroAvatar from "@/assets/astro-avatar.png";
import bungeeAvatar from "@/assets/bungee-avatar.png";
import { toast } from "sonner";
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
  created_at: string;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    checkAuth();
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
    }

    // Fetch bugs
    const { data: bugsData } = await supabase
      .from('bug_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (bugsData) {
      setBugs(bugsData.map(bug => ({
        id: bug.id,
        developer: bug.developer as 'astro' | 'bungee',
        wowClass: bug.wow_class as BugReport['wowClass'],
        title: bug.title,
        description: bug.description,
        priority: bug.priority as BugReport['priority'],
        status: bug.status as BugReport['status'],
        createdAt: new Date(bug.created_at),
        reporter: bug.reporter_name,
      })));
    }

    // Fetch code changes
    const { data: changesData } = await supabase
      .from('code_changes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (changesData) {
      setCodeChanges(changesData as CodeChange[]);
    }

    setLoading(false);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    const bugsChannel = supabase
      .channel('bugs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bug_tickets' },
        () => {
          checkAuth();
        }
      )
      .subscribe();

    const changesChannel = supabase
      .channel('code-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'code_changes' },
        () => {
          checkAuth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bugsChannel);
      supabase.removeChannel(changesChannel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Auf Wiedersehen, Held!");
    navigate("/");
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    const { error } = await supabase
      .from('bug_tickets')
      .update({ status: newStatus })
      .eq('id', ticketId);

    if (error) {
      toast.error("Fehler beim Aktualisieren des Status");
    } else {
      toast.success("Status aktualisiert!");
      checkAuth();
    }
  };

  const handleAddCodeChange = async (filePath: string, description: string, type: CodeChange['change_type'], ticketId?: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('code_changes')
      .insert({
        developer_id: profile.id,
        file_path: filePath,
        change_description: description,
        change_type: type,
        related_ticket_id: ticketId || null,
      });

    if (error) {
      toast.error("Fehler beim Speichern der Änderung");
    } else {
      toast.success("Code-Änderung protokolliert!");
      checkAuth();
    }
  };

  const getAvatar = () => {
    if (profile?.developer_type === 'astro') return astroAvatar;
    if (profile?.developer_type === 'bungee') return bungeeAvatar;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="wow-gold-text font-display text-xl animate-pulse">
          Lade Daten...
        </div>
      </div>
    );
  }

  const myBugs = bugs.filter(b => b.developer === profile?.developer_type);
  const otherBugs = bugs.filter(b => b.developer !== profile?.developer_type);

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
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="font-display text-xl wow-gold-text tracking-wider">
                    Developer Dashboard
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    Code Tracker & Bug Management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {profile && (
                  <div className="flex items-center gap-3">
                    {getAvatar() ? (
                      <img 
                        src={getAvatar()!} 
                        alt={profile.username}
                        className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-primary bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="hidden md:block">
                      <p className="font-display text-sm text-foreground">{profile.username}</p>
                      <p className="text-xs text-primary capitalize">{profile.developer_type}</p>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="wow-button flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid xl:grid-cols-3 gap-8">
            {/* My Bugs */}
            <div className="xl:col-span-2">
              <BugTicketList 
                bugs={myBugs} 
                title={`Meine Bug Reports (${profile?.developer_type})`}
                onStatusChange={handleStatusChange}
                showActions
              />
              
              {otherBugs.length > 0 && (
                <div className="mt-8">
                  <BugTicketList 
                    bugs={otherBugs} 
                    title="Andere Bug Reports"
                  />
                </div>
              )}
            </div>

            {/* Code Change Tracker */}
            <div>
              <CodeChangeTracker 
                changes={codeChanges}
                onAddChange={handleAddCodeChange}
                bugs={bugs}
                currentDeveloperId={profile?.id}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
