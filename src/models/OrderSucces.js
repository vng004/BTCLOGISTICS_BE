import mongoose from "mongoose";

const orderSuccesSchema = new mongoose.Schema({
  exportCode: { type: String, required: true },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: "Customer",
    default: null,
  },
  exportDate: { type: Date, default: Date.now },
  parcels: [
    {
      trackingCode: { type: String, required: true }, // Mã Vận Đơn
      quantity: { type: Number, default: 1 }, // Số Lượng (luôn là 1)
      weight: { type: String, required: true }, // Cân Nặng (Kg)
      actualCubicMeter: String, // M3 Thực Tính
      actualWeight: String, // Cân Nặng Thực
      length: String, // Chiều Dài 
      width: String,  // Chiều Rộng 
      height: String, // Chiều cao
    },
  ],

  parcelInformation: String,
  totalActualWeight: { totalActualWeight1: { type: String }, totalActualWeight2: { type: String } }, // Tổng Cân Nặng Thực
  transportFeeRate: { transportFeeRate1: { type: String, default: 0 }, transportFeeRate2: { type: String, default: 0 } }, // Đơn Giá Vận Chuyển
  transportFeeNote: { type: String, default: 0 }, // Phụ thu đóng gỗ bảo hiểm
  importEntrustmentFee: { type: String, default: 0 }, // Phí ủy thác nhập khẩu
  shipFeeNote: { type: String, default: 0 }, // Phí Ship
  totalAmount: { type: String, required: true }, // Số Tiền Cần Thanh Toán

  customServices: [
    {
      name: String,
      value: String
    },
  ],

});

export default mongoose.model("OrderSucces", orderSuccesSchema);