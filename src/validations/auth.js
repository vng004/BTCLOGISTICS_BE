import Joi from "joi";

const authSchema = Joi.object({
    userName: Joi.string().trim().min(3).max(50).required().messages({
        "string.empty": "Tên người dùng không được để trống",
        "string.min": "Tên người dùng phải có ít nhất 3 ký tự",
        "string.max": "Tên người dùng không được vượt quá 50 ký tự",
        "any.required": "Tên người dùng là bắt buộc"
    }),
    password: Joi.string().trim().min(6).required().messages({
        "string.empty": "Mật khẩu không được để trống",
        "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
        "any.required": "Mật khẩu là bắt buộc"
    }),
    role: Joi.string().optional()
})
export default  authSchema