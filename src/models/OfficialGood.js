import mongoose from "mongoose";

const officialGoodSchema = new mongoose.Schema({
    productName: String,
    productImage: [{ type: String, require: true }],
    hsCode: String,
    //Thông số sp
    productSpecs: {
        material: {
            type: String,
        },
        dimensions: {
            type: String,
        },
        technicalSpecs: {
            type: String,
        }
    },
    //quy cách đóng kiện hàng
    packagingDetails: {
        packageCount: {
            type: Number,
        },
        itemsPerPackage: {
            type: Number,
        },
        packageDimensions: {
            type: String,
        },
        packageWeight: Number
    },

    // Thông tin khách hàng
    fullName: String,
    phone: String,
    email: String,

    // Chi phí và thuế
    importEntrustmentFee: {
        type: Number,

        description: "Phí ủy thác nhập khẩu (hàng ghép)"
    },
    pickupFee: {
        type: Number,
        description: "Phí pickup (nếu có)"
    },
    reinforcementFee: {
        type: Number,
        description: "Phí đóng gỗ, gia cố, kiểm đếm"
    },
    internationalShippingFee: {
        type: Number,
        description: "Cước vận chuyển quốc tế"
    },

    vatTax: {
        type: Number,

        description: "Thuế giá trị gia tăng (VAT)"
    },

    importTax: {
        type: Number,
        description: "Thuế nhập khẩu"
    },

    specialConsumptionTax: {
        type: Number,
        description: "Thuế tiêu thụ đặc biệt (nếu có)"
    },
    environmentalTax: {
        type: Number,
        description: "Thuế bảo vệ môi trường (nếu có)"
    },
    customsAndOtherFees: {
        customsFee: {
            type: Number,
            description: "Lệ phí hải quan"
        },
        inspectionFee: {
            type: Number,
            description: "Phí kiểm tra chuyên ngành"
        }
    },
    storageAndHandlingFee: {
        type: Number,
        description: "Phí lưu kho, bốc dỡ 2 đầu"
    },
    domesticShippingFee: {
        type: Number,
        description: "Phí vận chuyển nội địa VN"
    },

    // Trạng thái đơn hàng
    status: {
        type: Number,
        enum: [
            0,// "Tiếp nhận đơn hàng",
            1,// "Xử lý và báo giá",
            2,// "Khách đã duyệt",
            3,// "Đã duyệt và lên đơn",
            4,// "Kho TQ nhận đơn",
            5,// "Đang vận chuyển về VN (hải quan kiểm hóa)",
            6,// "Hàng về kho VN",
            7,// "Giao hàng và thanh toán",
            8,// "Đơn hàng đã hoàn thành"
            9, // Khách hàng hủy đơn
        ],
        default: 0 //"Tiếp nhận đơn hàng",
    },
    statusHistory: [
        {
            status: {
                type: Number,
                enum: [0,// "Tiếp nhận đơn hàng",
                    1,// "Xử lý và báo giá",
                    2,// "Khách đã duyệt",
                    3,// "Đã duyệt và lên đơn",
                    4,// "Kho TQ nhận đơn",
                    5,// "Đang vận chuyển về VN (hải quan kiểm hóa)",
                    6,// "Hàng về kho VN",
                    7,// "Giao hàng và thanh toán",
                    8,// "Đơn hàng đã hoàn thành"
                    9, // Khách hàng hủy đơn
                ],
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

},
    {
        timestamps: true,
    });

export default mongoose.model("OfficialGood", officialGoodSchema)