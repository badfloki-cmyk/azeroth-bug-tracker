import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeatureRequest extends Document {
    developer: "astro" | "bungee";
    category: "class" | "esp" | "other";
    wow_class?: string;
    title: string;
    description: string;
    status: "open" | "accepted" | "rejected";
    discord_username: string;
    sylvanas_username: string;
    discord_message_id?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeatureRequestSchema = new Schema(
    {
        developer: { type: String, required: true, enum: ["astro", "bungee"] },
        category: { type: String, required: true, enum: ["class", "esp", "other"], default: "class" },
        wow_class: { type: String, default: null },
        title: { type: String, required: true },
        description: { type: String, required: true },
        status: { type: String, required: true, enum: ["open", "accepted", "rejected"], default: "open" },
        discord_username: { type: String, required: true },
        sylvanas_username: { type: String, required: true },
        discord_message_id: { type: String, default: null },
    },
    { timestamps: true }
);

const FeatureRequest: Model<IFeatureRequest> = mongoose.models.FeatureRequest ||
    mongoose.model<IFeatureRequest>("FeatureRequest", FeatureRequestSchema);

export default FeatureRequest;
