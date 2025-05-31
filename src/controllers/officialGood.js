import OfficialGood from "../models/OfficialGood.js";
import { sendEmail } from "../utils/email.js"; // Giả định có hàm sendEmail

export const getOfficialGood = async (req, res, next) => {
    try {
        const { page = 1, per_page = 6, keyword = "", status } = req.query;
        const query = {};

        const Page = parseInt(page);
        const perPage = parseInt(per_page);
        const skip = (Page - 1) * perPage;

        if (keyword) {
            query.$or = [
                { fullName: { $regex: keyword, $options: "i" } },
                { phone: { $regex: keyword, $options: "i" } },
            ];
        }
        if (status !== "" && status !== undefined) {
            const statusNumber = parseInt(status);
            if (!isNaN(statusNumber) && [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(statusNumber)) {
                query.status = statusNumber;
            }
        }

        const total = await OfficialGood.countDocuments(query);
        const data = await OfficialGood.find(query)
            .skip(skip)
            .limit(perPage)
            .sort({ createdAt: -1 });

        res.status(200).json({
            // Sửa status code thành 200
            success: true,
            message: "Lấy thông tin sản phẩm nhận báo giá thành công",
            data,
            meta: {
                total,
                page: Page,
                per_page: perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: "Lấy thông tin sản phẩm nhận báo giá thất bại",
            error: error.message,
        });
    }
};

export const getOfficialGoodById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await OfficialGood.findById(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm nhận báo giá với ID này",
            });
        }

        res.status(200).json({
            // Sửa status code thành 200
            success: true,
            message: "Lấy thông tin sản phẩm nhận báo giá thành công",
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: "Lấy thông tin sản phẩm nhận báo giá thất bại",
            error: error.message,
        });
    }
};

export const addOfficialGood = async (req, res, next) => {
    try {
        const data = await OfficialGood.create({
            ...req.body,
            status: 0, // Mặc định trạng thái ban đầu là 0
            statusHistory: [
                {
                    status: 0,
                    timestamp: new Date(),
                },
            ],
        });
        res.status(201).json({
            success: true,
            message: "Thông tin sản phẩm nhận báo giá gửi thành công",
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: "Gửi thông tin sản phẩm nhận báo giá thất bại",
            error: error.message,
        });
    }
};

// Cập nhật sản phẩm nhận báo giá
export const updateOfficialGood = async (req, res, next) => {
    try {
        const { status, fullName, phone } = req.body;

        // Lấy thông tin sản phẩm hiện tại
        const existingGood = await OfficialGood.findById(req.params.id);
        if (!existingGood) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm nhận báo giá với ID này",
            });
        }

        // Kiểm tra status hợp lệ
        const statusNumber = parseInt(status);
        if (status !== undefined && (isNaN(statusNumber) || ![0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(statusNumber))) {
            return res.status(400).json({
                success: false,
                message: "Trạng thái không hợp lệ. Trạng thái phải từ 0 đến 9.",
            });
        }

        // Kiểm tra nếu trạng thái hiện tại là 8 hoặc 9, không cho phép thay đổi status
        if (existingGood.status === 8 || existingGood.status === 9) {
            return res.status(400).json({
                success: false,
                message: "Đơn hàng đã hoàn thành hoặc bị từ chối, không thể thay đổi trạng thái",
            });
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = { ...req.body };

        // Nếu có thay đổi status, thêm vào statusHistory
        if (status !== undefined && status !== existingGood.status) {
            updateData.statusHistory = [
                ...existingGood.statusHistory,
                {
                    status: statusNumber,
                    timestamp: new Date(),
                },
            ];
            updateData.status = statusNumber; // Cập nhật trạng thái mới
        }

        const data = await OfficialGood.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        // Gửi email nếu status = 1
        if (statusNumber === 1) {
            const subject = "Thông báo: Sản phẩm của bạn đã được báo giá từ BTC Logistics";
            const text = `Kính gửi Quý khách ${fullName},\r\n\r\n` +
                `Chúng tôi xin thông báo rằng sản phẩm của Quý khách đã được đội ngũ BTC Logistics báo giá thành công. Đây là bước quan trọng để tiếp tục quá trình xử lý đơn hàng.\r\n\r\n` +
                `Quý khách vui lòng kiểm tra chi tiết báo giá và xác nhận đơn hàng trong thời gian sớm nhất để chúng tôi có thể hỗ trợ tốt nhất. Nếu có bất kỳ thắc mắc nào, Quý khách có thể liên hệ với chúng tôi qua email: Adlogistics.btc@gmail.com hoặc hotline: 088 9296 929.\r\n\r\n` +
                `BTC Logistics xin chân thành cảm ơn sự tin tưởng và hợp tác của Quý khách!\r\n\r\n` +
                `Trân trọng,\r\n` +
                `Đội ngũ BTC Logistics`;
            await sendEmail(data.email, subject, text);
        }
        if (statusNumber === 2) {
            const subject = `Thông báo: Đơn hàng của khách hàng ${fullName} với ${phone} đã được khách hàng đồng ý đặt hàng sau khi nhận báo giá`;
            const text = ``;
            await sendEmail(process.env.EMAIL_USERNAME, subject, text);
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm nhận báo giá thành công",
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật sản phẩm nhận báo giá thất bại",
            error: error.message,
        });
    }
};

// Xóa sản phẩm nhận báo giá
export const removeOfficialGood = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Lấy thông tin sản phẩm hiện tại
        const existingGood = await OfficialGood.findById(id);
        if (!existingGood) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm nhận báo giá với ID này",
            });
        }

        // Kiểm tra trạng thái, chỉ cho phép xóa khi status là 0 hoặc 9
        if (existingGood.status !== 0 && existingGood.status !== 9) {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xóa sản phẩm khi trạng thái là 'Tiếp nhận đơn hàng' hoặc 'Hủy đơn'",
            });
        }

        // Thực hiện xóa sản phẩm
        const data = await OfficialGood.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Xóa thông tin sản phẩm nhận báo giá thành công",
            data,
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            message: "Xóa thông tin sản phẩm nhận báo giá thất bại",
            error: error.message,
        });
    }
};