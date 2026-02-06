import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/lib/api"; // Updated to use our custom API
import { WoWPanel } from "@/components/WoWPanel";
import { Shield, Eye, EyeOff } from "lucide-react";
import wowBackground from "@/assets/wow-background.jpg";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");
  const [username, setUsername] = useState("");
  const [developerType, setDeveloperType] = useState<'astro' | 'bungee' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in via token
    const token = localStorage.getItem('token');
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const data = await authAPI.login(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success("Welcome back, Hero!");
        navigate("/dashboard");
      } else {
        if (!username || !developerType || !registrationPassword) {
          toast.error("Please fill in all fields.");
          return;
        }

        // Validate that only 'bungee' or 'astro' can register
        const lowerUsername = username.toLowerCase();
        if (lowerUsername !== 'bungee' && lowerUsername !== 'astro') {
          toast.error("This registration is not allowed. Only Bungee and Astro can register.");
          return;
        }

        // Validate that username matches developer type
        if (lowerUsername !== developerType.toLowerCase()) {
          toast.error(`The username must be '${developerType}'.`);
          return;
        }

        const data = await authAPI.register(username, email, password, developerType, registrationPassword);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        toast.success("Registration successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${wowBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

      {/* Auth Form */}
      <WoWPanel className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-3 mb-8 text-center">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="font-display text-2xl wow-gold-text">
            Classic / TBC AIO Bug Report
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Developer Login" : "Registration"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block font-display text-sm text-primary mb-2 tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your character name..."
                  className="wow-input"
                  required={!isLogin}
                />
              </div>

              <div>
                <label className="block font-display text-sm text-primary mb-3 tracking-wider">
                  Developer Type
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setDeveloperType('astro')}
                    className={`flex-1 py-3 rounded-sm border-2 font-display transition-all ${developerType === 'astro'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    Astro
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeveloperType('bungee')}
                    className={`flex-1 py-3 rounded-sm border-2 font-display transition-all ${developerType === 'bungee'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                      }`}
                  >
                    Bungee
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="wow-input"
              required
            />
          </div>

          <div>
            <label className="block font-display text-sm text-primary mb-2 tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="wow-input pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block font-display text-sm text-primary mb-2 tracking-wider">
                Registration Key
              </label>
              <input
                type="password"
                value={registrationPassword}
                onChange={(e) => setRegistrationPassword(e.target.value)}
                placeholder="Secret key..."
                className="wow-input"
                required={!isLogin}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="wow-button-primary w-full py-3"
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already registered? Login"}
          </button>
        </div>
      </WoWPanel>
    </div>
  );
};

export default Auth;
