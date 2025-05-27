import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    customerCode: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    parcels: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Parcel" }
    ],
}, {
    timestamps: true
});

export default mongoose.model("Customer", customerSchema);
