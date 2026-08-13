import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  coverImageUrl: {
    type: String,
  },
  coverImagePublicId: {
    type: String,
  },
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "private",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastMessage:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupMessage",
  }
});
export const Group = mongoose.model("Group", groupSchema);
