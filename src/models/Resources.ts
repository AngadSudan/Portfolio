import mongoose, { Schema, model } from "mongoose";
import { attachmentSchema } from "./Experience";

const ResourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

const Resource = mongoose.models.Resource || model("Resource", ResourceSchema);

export default Resource;
