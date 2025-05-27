import Joi from 'joi'

const customerSchema = Joi.object({
    customerCode: Joi.string().trim().required().messages({
        "string.empty": "Mã khách hàng không được để trống",
        "any.required": "Mã khách hàng là bắt buộc"
    }),
    email: Joi.string().trim().required().messages({
        "string.empty": "Email không được để trống",
        "any.required": "Email là bắt buộc"
    }),
    fullName: Joi.string().trim().required().messages({
        "string.empty": "Tên khách hàng không được để trống",
        "any.required": "Tên khách hàng là bắt buộc"
    }),
    address: Joi.string().trim().required().messages({
        "string.empty": "Địa chỉ khách hàng không được để trống",
        "any.required": "Địa chỉ khách hàng là bắt buộc"
    }),
    phone: Joi.string()
        .pattern(/^[0-9]+$/, "numbers")
        .min(10)
        .max(11)
        .required()
        .messages({
            "string.base": "SĐT khách hàng phải là chuỗi",
            "string.pattern.name": "SĐT khách hàng chỉ được chứa các ký tự số",
            "string.min": "SĐT khách hàng phải có ít nhất 10 ký tự",
            "string.max": "SĐT khách hàng không được dài quá 11 ký tự",
            "any.required": "SĐT khách hàng là bắt buộc",
        }),
    parcel: Joi.string().optional()
});

const assignCustomerSchema = Joi.object({
    trackingCode: Joi.string().trim().required().messages({
        "string.empty": "Mã tracking không được để trống",
        "any.required": "Mã tracking là bắt buộc"
    }),
    customerCode: Joi.string().trim().required().messages({
        "string.empty": "Mã khách hàng không được để trống",
        "any.required": "Mã khách hàng là bắt buộc"
    })
});
export { customerSchema, assignCustomerSchema }