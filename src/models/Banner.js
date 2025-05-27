import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    images: [{ type: String, require: true }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true })
export default mongoose.model("Banner", bannerSchema)