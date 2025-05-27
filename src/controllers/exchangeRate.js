import ExchangeRate from "../models/ExchangeRate.js";

export const getExchangeRate = async (req, res, next) => {
    try {
        const data = await ExchangeRate.findOne();
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tỉ giá với ID này"
            });
        }
        res.status(200).json({
            success: true,
            message: "Lấy dữ liệu thành công",
            data
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Lấy dữ liệu thất bại",
            error: error.message
        });
    }
};

export const addExchangeRate = async (req, res, next) => {
    try {
        const existingRate = await ExchangeRate.findOne();
        if (existingRate) {
            return res.status(400).json({
                success: false,
                message: "Đã có tỉ giá trong hệ thống, vui lòng sử dụng cập nhật thay vì thêm mới"
            });
        }
        const data = await ExchangeRate.create(req.body);

        res.status(201).json({
            success: true,
            message: "Thêm dữ liệu thành công",
            data
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Thêm dữ liệu thất bại",
            error: error.message
        });
    }
};

export const updateExchangeRate = async (req, res, next) => {
    try {

        const data = await ExchangeRate.findOneAndUpdate(
            {},
            req.body,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Cập nhật dữ liệu thành công",
            data
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Cập nhật dữ liệu thất bại",
            error: error.message
        });
    }
};