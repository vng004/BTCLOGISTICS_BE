import mongoose from "mongoose";

const exchangeRateSchema = new mongoose.Schema({
    rate: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model("ExchangeRate", exchangeRateSchema);