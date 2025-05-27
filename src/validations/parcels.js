import Joi from 'joi'

const parcelSchema = Joi.object({
    trackingCode: Joi.string().trim().messages({
        "string.empty": "Mã tracking không được để trống"
    }),
    weight: Joi.string().trim().messages({
        "string.empty": "Cân nặng không được để trống"
    }),
    // inspection: Joi.boolean().messages({
    //     "boolean.empty": "inspection không được để trống"
    // }),
}).or("trackingCode", "weight").messages({
    "object.missing": "Phải cung cấp ít nhất trackingCode hoặc weight khi nhập thủ công"
});



const updateParcelStatusSchema = Joi.object({
    trackingCode: Joi.string().trim().messages({
        "string.empty": "Mã tracking không được để trống"
    }),
    shipmentStatus: Joi.number().valid(0, 1, 2, 3).messages({
        "number.base": "Trạng thái phải là số",
        "any.only": "Trạng thái phải là 0, 1, 2 hoặc 3"
    })
}).or("trackingCode", "shipmentStatus").messages({
    "object.missing": "Phải cung cấp ít nhất trackingCode hoặc shipmentStatus khi nhập thủ công"
});

export { parcelSchema, updateParcelStatusSchema }