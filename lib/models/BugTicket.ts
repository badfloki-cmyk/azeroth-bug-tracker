import mongoose, { Schema, Document, Model } from "mongoose";

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

const BugTicket: Model<IBugTicket> = mongoose.models.BugTicket ||
  mongoose.model<IBugTicket>("BugTicket", BugTicketSchema);

export default BugTicket;
