import mongoose from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true, // Mật khẩu đã mã hóa
    },
    plainPassword: {
      type: String, // Mật khẩu chưa mã hóa (plaintext)
      select: false, // Không trả về mặc định khi query
    },
    role: {
      type: String,
      enum: ["admin", "superAdmin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

authSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const Auth = mongoose.model("Auth", authSchema);

export default Auth;