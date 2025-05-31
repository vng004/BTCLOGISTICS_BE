import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema(
    {
        customerCode: {
            type: String,
            required: true,
        },
        purchaseCode: {
            type: String,
        },
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,

        },
        productName: {
            type: String,
            required: true,
        },
        productLink: {
            type: String,
            required: true,
        },
        orderDetails: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        email: {
            type: String,
        },
        actualValue: {
            type: String,
            required: true,
        },
        domesticFee: {
            type: String,
        },
        totalAmount: {
            type: String,
        },
        orderCode: {
            type: String,
            unique: true,
            required: true,
        },
        trackingCode: {
            type: String,
        },
        description: {
            type: String,
        },
        status: {
            type: Number,
            enum: [0, 1, 2, 3, 4],
            required: true,
            default: 0
        },
        
    statusHistory: [
        {
            status: {
                type: Number,
                enum: [0, 1, 2, 3,4],
                required: true,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ]
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);