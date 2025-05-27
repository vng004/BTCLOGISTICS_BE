import PurchaseOrder from '../models/PurchaseOrder.js';
import Customer from '../models/Customer.js';
import Parcel from '../models/Parcel.js';

// Lấy danh sách đơn hàng
export const getPurchaseOrders = async (req, res, next) => {
    try {
        const { page = 1, per_page = 6, keyword = '', status } = req.query;
        const query = {};

        const Page = parseInt(page);
        const perPage = parseInt(per_page);
        const skip = (Page - 1) * perPage;

        if (keyword) {
            query.$or = [
                { customerCode: { $regex: keyword, $options: 'i' } },
                { orderCode: { $regex: keyword, $options: 'i' } },
                { trackingCode: { $regex: keyword, $options: 'i' } },
                { productName: { $regex: keyword, $options: 'i' } },
            ];
        }
        if (status !== '' && status !== undefined) {
            const StatusNumber = parseInt(status)
            if (!isNaN(StatusNumber) && [0, 1, 2, 3, 4].includes(StatusNumber)) {
                query.status = StatusNumber
            }
        }

        const total = await PurchaseOrder.countDocuments(query);
        const data = await PurchaseOrder.find(query)
            .skip(skip)
            .limit(perPage)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách đơn hàng thành công',
            data,
            meta: {
                total,
                page: Page,
                per_page: perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: 'Lấy dữ liệu thất bại',
            error: error.message,
        });
    }
};
export const getPurchaseOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await PurchaseOrder.findById(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng với ID này',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Lấy dữ liệu đơn hàng thành công',
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: 'Lấy dữ liệu thất bại',
            error: error.message,
        });
    }
};
export const getPurchaseOrderByOrderCode = async (req, res, next) => {
    try {
        const { orderCode } = req.body;
        const data = await PurchaseOrder.findOne({ orderCode }); // Tìm theo orderCode
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng với mã này',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Lấy dữ liệu đơn hàng thành công',
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: 'Lấy dữ liệu thất bại',
            error: error.message,
        });
    }
};

// Thêm đơn hàng mới
export const addPurchaseOrder = async (req, res, next) => {
    try {
        const { customerCode } = req.body;

        const customer = await Customer.findOne({ customerCode });
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Mã khách hàng không tồn tại',
            });
        }

        // Tạo orderCode: customerCode + btc + timestamp (YYYYMMDDHHMMSS)
        const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
        const orderCode = `BT.${customerCode}-${randomSixDigits}`;

        // Kiểm tra orderCode đã tồn tại
        const existingOrder = await PurchaseOrder.findOne({ orderCode });
        if (existingOrder) {
            return res.status(400).json({
                success: false,
                message: 'Mã đơn hàng đã tồn tại, vui lòng thử lại',
            });
        }

        // Tạo đơn hàng với orderCode và các trường khác từ req.body
        const data = await PurchaseOrder.create({
            ...req.body,
            orderCode,
        });

        res.status(201).json({
            success: true,
            message: 'Thêm đơn hàng thành công',
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: 'Thêm đơn hàng thất bại',
            error: error.message,
        });
    }
};

// Cập nhật đơn hàng
export const updatePurchaseOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            customerCode,
            trackingCode,
        } = req.body;


        // Kiểm tra customerCode tồn tại
        if (customerCode) {
            const customer = await Customer.findOne({ customerCode });
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã khách hàng không tồn tại',
                });
            }
        }

        // Kiểm tra trackingCode tồn tại
        if (trackingCode) {
            const parcel = await Parcel.findOne({ trackingCode });
            if (!parcel) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã vận đơn không tồn tại',
                });
            }
        }

        // Cập nhật đơn hàng
        const data = await PurchaseOrder.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật đơn hàng thành công',
            data,
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: 'Cập nhật đơn hàng thất bại',
            error: error.message,
        });
    }
};

// Xóa đơn hàng
export const removePurchaseOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await PurchaseOrder.findByIdAndDelete(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng với ID này',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa đơn hàng thành công',
            data,
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: 'Xóa đơn hàng thất bại',
            error: error.message,
        });
    }
};