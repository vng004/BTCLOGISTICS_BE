import mongoose from "mongoose";

const parcelsSchema = new mongoose.Schema({
    trackingCode: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: "Customer",
        default: null,
    },
    weight: {
        type: String,
        default: 0,

    },
    description: { type: String, default: "" }
    ,
    shipmentStatus: {
        type: Number,
        enum: [0, 1, 2, 3],
    },
    statusHistory: [
        {
            status: {
                type: Number,
                enum: [0, 1, 2, 3],
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    inspection: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

export default mongoose.model("Parcel", parcelsSchema);
