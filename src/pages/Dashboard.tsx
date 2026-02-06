import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { userAPI, bugAPI, codeChangeAPI } from "@/lib/api";
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
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [codeChanges, setCodeChanges] = useState<CodeChange[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user && token) {
      loadDashboardData();
    }
  }, [user, token, authLoading, navigate]);

  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Fetch profile
      const profileData = await userAPI.getProfile(token);
      setProfile({
        id: profileData._id,
        username: profileData.username,
        developer_type: profileData.developer_type,
        avatar_url: profileData.avatar_url
      });

      // Fetch bugs
      const bugsData = await bugAPI.getAll();
      setBugs(bugsData.map((bug: any) => ({
        id: bug._id,
        developer: bug.developer as 'astro' | 'bungee',
        wowClass: bug.wow_class as BugReport['wowClass'],
        title: bug.title,
        description: bug.description,
        priority: bug.priority as BugReport['priority'],
        status: bug.status as BugReport['status'],
        createdAt: new Date(bug.createdAt),
        reporter: bug.reporter_name || bug.sylvanas_username || 'Unknown',
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
    navigate("/");
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    if (!token) return;
    try {
      await bugAPI.updateStatus(ticketId, newStatus, token);
      toast.success("Status updated!");
      loadDashboardData();
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const handleAddCodeChange = async (filePath: string, description: string, type: CodeChange['change_type'], ticketId?: string) => {
    if (!token || !profile) return;
    try {
      await codeChangeAPI.create({
        file_path: filePath,
        change_description: description,
        change_type: type,
        related_ticket_id: ticketId
      }, token);
      toast.success("Code change logged!");
      loadDashboardData();
    } catch (error) {
      toast.error("Error saving change");
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
          Loading data...
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
                title={`My Bug Reports (${profile?.developer_type})`}
                onStatusChange={handleStatusChange}
                showActions
              />

              {otherBugs.length > 0 && (
                <div className="mt-8">
                  <BugTicketList
                    bugs={otherBugs}
                    title="Other Bug Reports"
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
