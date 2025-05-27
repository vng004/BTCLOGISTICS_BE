export const validateRequest = (schema) => {
    return (req, res, next) => {
        // Nếu chỉ gửi file (req.body rỗng), bỏ qua validate
        if (!req.body || Object.keys(req.body).length === 0) {
            return next();
        }

        // Nếu có req.body, validate
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const messages = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: "Dữ liệu thủ công không hợp lệ",
                errors: messages
            });
        }
        next();
    };
};