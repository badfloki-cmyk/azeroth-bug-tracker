# Bungee × Astro Setup Script
# This script creates all necessary folders and files for MongoDB + GitHub migration

Write-Host "Creating folder structure..." -ForegroundColor Green

# Create directories
$dirs = @(
    "api/auth",
    "api/bugs",
    "api/code-changes",
    "api/users",
    "lib/auth",
    "lib/db",
    "lib/models",
    "src/lib"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "Created: $dir" -ForegroundColor Cyan
}

Write-Host "`nCreating files..." -ForegroundColor Green

# .env.local
@'
MONGODB_URI="mongodb+srv://mauromorelli_db_user:KHfWAhNX6MKFFomn@bungeexastro.zc7zbzf.mongodb.net/?appName=Bungeexastro"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
REACT_APP_API_URL="http://localhost:3000"
'@ | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "Created: .env.local" -ForegroundColor Cyan

# vercel.json
@'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "MONGODB_URI": "@MONGODB_URI",
    "JWT_SECRET": "@JWT_SECRET"
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/:path((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
'@ | Out-File -FilePath "vercel.json" -Encoding UTF8
Write-Host "Created: vercel.json" -ForegroundColor Cyan

# lib/db/mongodb.ts
@'
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
'@ | Out-File -FilePath "lib/db/mongodb.ts" -Encoding UTF8
Write-Host "Created: lib/db/mongodb.ts" -ForegroundColor Cyan

# lib/models/User.ts
@'
import mongoose, { Schema, Document } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  developer_type: "astro" | "bungee";
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      enum: ["bungee", "astro"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    developer_type: {
      type: String,
      required: true,
      enum: ["astro", "bungee"],
    },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
'@ | Out-File -FilePath "lib/models/User.ts" -Encoding UTF8
Write-Host "Created: lib/models/User.ts" -ForegroundColor Cyan

# lib/models/Profile.ts
@'
import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  user_id: mongoose.Types.ObjectId;
  username: string;
  developer_type: "astro" | "bungee";
  avatar_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    developer_type: {
      type: String,
      required: true,
      enum: ["astro", "bungee"],
    },
    avatar_url: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Profile ||
  mongoose.model<IProfile>("Profile", ProfileSchema);
'@ | Out-File -FilePath "lib/models/Profile.ts" -Encoding UTF8
Write-Host "Created: lib/models/Profile.ts" -ForegroundColor Cyan

# lib/models/BugTicket.ts
@'
import mongoose, { Schema, Document } from "mongoose";

export interface IBugTicket extends Document {
  developer: "astro" | "bungee";
  wow_class: string;
  rotation: string;
  pvpve_mode: "pve" | "pvp";
  level: number;
  expansion: "tbc" | "era" | "hc";
  title: string;
  description: string;
  current_behavior: string;
  expected_behavior: string;
  logs?: string;
  video_url?: string;
  screenshot_urls?: string[];
  discord_username: string;
  sylvanas_username: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved";
  reporter_name: string;
  reporter_user_id?: mongoose.Types.ObjectId;
  assigned_to?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BugTicketSchema = new Schema(
  {
    developer: { type: String, required: true, enum: ["astro", "bungee"] },
    wow_class: { type: String, required: true },
    rotation: { type: String, required: true },
    pvpve_mode: { type: String, required: true, enum: ["pve", "pvp"] },
    level: { type: Number, required: true, default: 80 },
    expansion: { type: String, required: true, enum: ["tbc", "era", "hc"] },
    title: { type: String, required: true },
    description: { type: String, required: true },
    current_behavior: { type: String, required: true },
    expected_behavior: { type: String, required: true },
    logs: { type: String, default: null },
    video_url: { type: String, default: null },
    screenshot_urls: { type: [String], default: [] },
    discord_username: { type: String, required: true },
    sylvanas_username: { type: String, required: true },
    priority: { type: String, required: true, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, required: true, enum: ["open", "in-progress", "resolved"], default: "open" },
    reporter_name: { type: String, required: true },
    reporter_user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assigned_to: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.BugTicket ||
  mongoose.model<IBugTicket>("BugTicket", BugTicketSchema);
'@ | Out-File -FilePath "lib/models/BugTicket.ts" -Encoding UTF8
Write-Host "Created: lib/models/BugTicket.ts" -ForegroundColor Cyan

# lib/models/CodeChange.ts
@'
import mongoose, { Schema, Document } from "mongoose";

export interface ICodeChange extends Document {
  developer_id: mongoose.Types.ObjectId;
  file_path: string;
  change_description: string;
  change_type: "create" | "update" | "delete" | "fix" | "feature";
  related_ticket_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CodeChangeSchema = new Schema(
  {
    developer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    file_path: { type: String, required: true },
    change_description: { type: String, required: true },
    change_type: { type: String, required: true, enum: ["create", "update", "delete", "fix", "feature"] },
    related_ticket_id: { type: Schema.Types.ObjectId, ref: "BugTicket", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.CodeChange ||
  mongoose.model<ICodeChange>("CodeChange", CodeChangeSchema);
'@ | Out-File -FilePath "lib/models/CodeChange.ts" -Encoding UTF8
Write-Host "Created: lib/models/CodeChange.ts" -ForegroundColor Cyan

# lib/auth/jwt.ts
@'
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  developer_type: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  return null;
}
'@ | Out-File -FilePath "lib/auth/jwt.ts" -Encoding UTF8
Write-Host "Created: lib/auth/jwt.ts" -ForegroundColor Cyan

# src/lib/api.ts
@'
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    developer_type: string;
  };
}

interface BugReport {
  _id?: string;
  developer: string;
  wow_class: string;
  rotation: string;
  pvpve_mode: string;
  level: number;
  expansion: string;
  title: string;
  description: string;
  current_behavior: string;
  expected_behavior: string;
  logs?: string;
  video_url?: string;
  screenshot_urls?: string[];
  discord_username: string;
  sylvanas_username: string;
  priority: string;
  status: string;
  reporter_name: string;
  createdAt: string;
}

export const authAPI = {
  register: async (username: string, email: string, password: string, developer_type: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, developer_type }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }
    return response.json();
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }
    return response.json();
  },
};

export const userAPI = {
  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  },
};

export const bugAPI = {
  getAll: async (): Promise<BugReport[]> => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch bugs");
    return response.json();
  },

  create: async (bug: BugReport, token: string) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bug),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create bug report");
    }
    return response.json();
  },

  updateStatus: async (ticketId: string, status: string, token: string) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: ticketId, status }),
    });
    if (!response.ok) throw new Error("Failed to update bug status");
    return response.json();
  },
};

export const codeChangeAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/code-changes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch code changes");
    return response.json();
  },

  create: async (change: { file_path: string; change_description: string; change_type: string; related_ticket_id?: string }, token: string) => {
    const response = await fetch(`${API_URL}/api/code-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(change),
    });
    if (!response.ok) throw new Error("Failed to create code change");
    return response.json();
  },
};
'@ | Out-File -FilePath "src/lib/api.ts" -Encoding UTF8
Write-Host "Created: src/lib/api.ts" -ForegroundColor Cyan

# src/lib/AuthContext.tsx
@'
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "./api";

interface User {
  id: string;
  username: string;
  email: string;
  developer_type: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, developer_type: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, developer_type: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(username, email, password, developer_type);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("auth_user", JSON.stringify(response.user));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const value: AuthContextType = { user, token, isLoading, error, login, register, logout, setError };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
'@ | Out-File -FilePath "src/lib/AuthContext.tsx" -Encoding UTF8
Write-Host "Created: src/lib/AuthContext.tsx" -ForegroundColor Cyan

# api/auth/register.ts
@'
import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import User from "../../lib/models/User";
import Profile from "../../lib/models/Profile";
import { generateToken } from "../../lib/auth/jwt";

const ALLOWED_USERS = { bungee: "bungee", astro: "astro" };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDB();
    const { username, email, password, developer_type } = req.body;
    if (!username || !email || !password || !developer_type) return res.status(400).json({ error: "Missing required fields" });
    const lowerUsername = username.toLowerCase();
    if (!(lowerUsername in ALLOWED_USERS)) return res.status(403).json({ error: "Diese Registrierung ist nicht erlaubt. Nur Bungee und Astro können sich registrieren." });
    if (lowerUsername !== developer_type.toLowerCase()) return res.status(400).json({ error: `Der Benutzername muss '${developer_type}' sein.` });
    const existingUser = await User.findOne({ $or: [{ email }, { username: lowerUsername }] });
    if (existingUser) return res.status(409).json({ error: "Diese E-Mail oder dieser Benutzername existiert bereits." });
    const user = new User({ username: lowerUsername, email, password, developer_type: developer_type.toLowerCase() });
    await user.save();
    await Profile.create({ user_id: user._id, username: user.username, developer_type: user.developer_type });
    const token = generateToken({ id: user._id.toString(), username: user.username, email: user.email, developer_type: user.developer_type });
    return res.status(201).json({ message: "Registrierung erfolgreich!", token, user: { id: user._id, username: user.username, email: user.email, developer_type: user.developer_type } });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
'@ | Out-File -FilePath "api/auth/register.ts" -Encoding UTF8
Write-Host "Created: api/auth/register.ts" -ForegroundColor Cyan

# api/auth/login.ts
@'
import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import User from "../../lib/models/User";
import { generateToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDB();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    const token = generateToken({ id: user._id.toString(), username: user.username, email: user.email, developer_type: user.developer_type });
    return res.status(200).json({ message: "Willkommen zurück, Held!", token, user: { id: user._id, username: user.username, email: user.email, developer_type: user.developer_type } });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
'@ | Out-File -FilePath "api/auth/login.ts" -Encoding UTF8
Write-Host "Created: api/auth/login.ts" -ForegroundColor Cyan

# api/users/profile.ts
@'
import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import Profile from "../../lib/models/Profile";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDB();
    const token = extractToken(req.headers.authorization);
    if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
    const profile = await Profile.findOne({ user_id: payload.id });
    if (!profile) return res.status(404).json({ error: "Profil nicht gefunden" });
    return res.status(200).json({ id: profile._id, user_id: profile.user_id, username: profile.username, developer_type: profile.developer_type, avatar_url: profile.avatar_url });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
'@ | Out-File -FilePath "api/users/profile.ts" -Encoding UTF8
Write-Host "Created: api/users/profile.ts" -ForegroundColor Cyan

# api/bugs/tickets.ts (simplified to fit)
@'
import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import BugTicket from "../../lib/models/BugTicket";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const tickets = await BugTicket.find().sort({ createdAt: -1 });
      return res.status(200).json(tickets);
    }
    if (req.method === "POST") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { developer, wow_class, rotation, pvpve_mode, level, expansion, title, description, current_behavior, expected_behavior, logs, video_url, screenshot_urls, discord_username, sylvanas_username, priority, reporter_name } = req.body;
      if (!developer || !wow_class || !rotation || !pvpve_mode || !title || !current_behavior || !expected_behavior || !discord_username || !sylvanas_username || !reporter_name) return res.status(400).json({ error: "Missing required fields" });
      if (current_behavior.length < 200) return res.status(400).json({ error: "Current behavior must be at least 200 characters" });
      if (expected_behavior.length < 200) return res.status(400).json({ error: "Expected behavior must be at least 200 characters" });
      const bugTicket = new BugTicket({ developer, wow_class, rotation, pvpve_mode, level, expansion, title, description: current_behavior, current_behavior, expected_behavior, logs: logs || null, video_url: video_url || null, screenshot_urls: screenshot_urls || [], discord_username, sylvanas_username, priority: priority || "medium", status: "open", reporter_name, reporter_user_id: payload.id });
      await bugTicket.save();
      return res.status(201).json({ message: "Bug Report erfolgreich erstellt!", ticket: bugTicket });
    }
    if (req.method === "PATCH") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { id, status } = req.body;
      if (!id || !status) return res.status(400).json({ error: "ID und Status erforderlich" });
      const bugTicket = await BugTicket.findByIdAndUpdate(id, { status }, { new: true });
      if (!bugTicket) return res.status(404).json({ error: "Bug Ticket nicht gefunden" });
      return res.status(200).json({ message: "Status aktualisiert!", ticket: bugTicket });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Bug tickets error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
'@ | Out-File -FilePath "api/bugs/tickets.ts" -Encoding UTF8
Write-Host "Created: api/bugs/tickets.ts" -ForegroundColor Cyan

# api/code-changes/index.ts
@'
import { NextApiRequest, NextApiResponse } from "next";
import { connectDB } from "../../lib/db/mongodb";
import CodeChange from "../../lib/models/CodeChange";
import { verifyToken, extractToken } from "../../lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();
    if (req.method === "GET") {
      const changes = await CodeChange.find().sort({ createdAt: -1 }).limit(50).populate("developer_id", "username developer_type").populate("related_ticket_id");
      return res.status(200).json(changes);
    }
    if (req.method === "POST") {
      const token = extractToken(req.headers.authorization);
      if (!token) return res.status(401).json({ error: "Authentifizierung erforderlich" });
      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: "Ungültiges Token" });
      const { file_path, change_description, change_type, related_ticket_id } = req.body;
      if (!file_path || !change_description || !change_type) return res.status(400).json({ error: "Missing required fields" });
      const codeChange = new CodeChange({ developer_id: payload.id, file_path, change_description, change_type, related_ticket_id: related_ticket_id || null });
      await codeChange.save();
      await codeChange.populate("developer_id", "username developer_type");
      return res.status(201).json({ message: "Code-Änderung protokolliert!", change: codeChange });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Code changes error:", error);
    return res.status(500).json({ error: "Ein Fehler ist aufgetreten." });
  }
}
'@ | Out-File -FilePath "api/code-changes/index.ts" -Encoding UTF8
Write-Host "Created: api/code-changes/index.ts" -ForegroundColor Cyan

Write-Host "`n✅ All files created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: git add ." -ForegroundColor White
Write-Host "3. Run: git commit -m 'Add MongoDB backend and API routes'" -ForegroundColor White
Write-Host "4. Run: git push origin neon-den" -ForegroundColor White
