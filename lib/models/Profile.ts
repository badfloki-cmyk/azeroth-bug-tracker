import mongoose, { Schema, Document, Model } from "mongoose";

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

const Profile: Model<IProfile> = mongoose.models.Profile ||
  mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
