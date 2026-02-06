import mongoose, { Schema, Document, Model } from "mongoose";

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
    developer_id: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    file_path: { type: String, required: true },
    change_description: { type: String, required: true },
    change_type: { type: String, required: true, enum: ["create", "update", "delete", "fix", "feature"] },
    related_ticket_id: { type: Schema.Types.ObjectId, ref: "BugTicket", default: null },
  },
  { timestamps: true }
);

const CodeChange: Model<ICodeChange> = mongoose.models.CodeChange ||
  mongoose.model<ICodeChange>("CodeChange", CodeChangeSchema);

export default CodeChange;
