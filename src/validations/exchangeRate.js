import Joi from 'joi'

const exchangeRateSchema = Joi.object({
    rate: Joi.string().trim().required().messages({
        "string.empty": "Mã tracking không được để trống",
        "any.required": "Mã tracking là bắt buộc"
    })
});

export default  exchangeRateSchema