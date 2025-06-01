import xlsx from 'xlsx';
import Customer from "../models/Customer.js";
import Parcel from "../models/Parcel.js";

export const getParcel = async (req, res, next) => {
    try {
        const { keyword = "", page = 1, per_page = 6, startDate, endDate, shipmentStatus, customerCode, } = req.query;
        const query = {};

        if (keyword) {
            query.$or = [
                { trackingCode: { $regex: keyword, $options: "i" } },
                { packageCode: { $regex: keyword, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate);
            }
        }

        if (shipmentStatus !== undefined && shipmentStatus !== "") {
            const status = parseInt(shipmentStatus)
            if (!isNaN(status) && [0, 1, 2, 3].includes(status)) {
                query.shipmentStatus = status
            }
        }

        if (customerCode) {
            const customer = await Customer.findOne({ customerCode: { $regex: customerCode, $options: "i" } })
            if (customer) {
                query.customer = customer._id
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: "Không có mã khách hành nào phù hợp!",
                });
            }
        }

        const Page = parseInt(page);
        const perPage = parseInt(per_page);
        const skip = (Page - 1) * perPage;

        const data = await Parcel.find(query)
            .populate('customer')
            .skip(skip)
            .limit(perPage)
            .sort({ createdAt: -1 });
        const total = await Parcel.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Lấy kiện hàng thành công!",
            data,
            meta: {
                total,
                page: Page,
                perPage,
                totalPages: Math.ceil(total / perPage)
            }
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            error: error.message
        });
    }
};

export const getParcelById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Tìm Parcel theo id và populate customer
        const data = await Parcel.findById(id).populate("customer");

        if (!data) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy kiện hàng với id: ${id}`, // Sửa trackingCode thành id
            });
        }

        let statusChangeDurations = [];
        const statusHistory = data.statusHistory || [];

        if (statusHistory.length >= 2) {
            for (let i = 1; i < statusHistory.length; i++) {
                const prevStatus = statusHistory[i - 1];
                const currentStatus = statusHistory[i];

                const durationMs = new Date(currentStatus.timestamp) - new Date(prevStatus.timestamp);
                const durationMinutes = Math.floor(durationMs / (1000 * 60)); // Chuyển đổi thành phút

                statusChangeDurations.push({
                    fromStatus: prevStatus.status,
                    toStatus: currentStatus.status,
                    durationMinutes,
                    fromTime: prevStatus.timestamp,
                    toTime: currentStatus.timestamp,
                });
            }
        }

        // Trả về dữ liệu bao gồm cả statusChangeDurations
        res.status(200).json({
            success: true,
            message: "Lấy chi tiết kiện hàng thành công!",
            data: {
                ...data.toObject(), // Chuyển đổi Mongoose document thành plain object
                statusChangeDurations, // Thêm statusChangeDurations vào response
            },
        });
    } catch (error) {
        console.log(error);
        next({
            status: 500,
            success: false,
            error: error.message,
        });
    }
};

export const addParcel = async (req, res, next) => {
    try {
        const { trackingCode, weight } = req.body; // Không lấy description từ req.body
        let parcelsData = [];
        let existingCode = [];

        if (req.file) {
            const wk = xlsx.read(req.file.buffer, { type: "buffer" });
            const sheetName = wk.SheetNames[0];
            const sheet = wk.Sheets[sheetName];

            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            const fileParcels = await Promise.all(
                data.slice(1).map(async (row) => {
                    const trackingCode = row[0];
                    const weight = row[1];

                    if (!trackingCode || trackingCode.toString().trim() === "") {
                        console.log(`Bỏ qua kiện hàng với Mã tracking rỗng: ${JSON.stringify(row)}`);
                        return null;
                    }

                    return {
                        trackingCode,
                        weight,

                        shipmentStatus: 0,
                        statusHistory: [
                            {
                                status: 0,
                                timestamp: new Date(),
                            },
                        ],
                    };
                })
            );
            parcelsData = parcelsData.concat(fileParcels.filter((item) => item !== null));
        }

        if (trackingCode && weight !== undefined) {
            parcelsData.push({
                trackingCode,
                weight: parseFloat(weight) || 0,

                shipmentStatus: 0,
                statusHistory: [
                    {
                        status: 0,
                        timestamp: new Date(),
                    },
                ],
            });
        }

        if (parcelsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ít nhất một kiện hàng hợp lệ (qua file hoặc thủ công)",
            });
        }

        const trackingCodes = parcelsData.map((item) => item.trackingCode);

        const existingParcels = await Parcel.find({ trackingCode: { $in: trackingCodes } });
        existingCode = existingParcels.map((parcel) => parcel.trackingCode);

        if (existingCode.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Đã có kiện hàng với mã tracking ${existingCode.join(", ")}, không thể thêm`,
                duplicateTrackingCodes: existingCode,
            });
        }

        const createdParcels = await Parcel.create(parcelsData);

        const updatedParcels = await Promise.all(
            createdParcels.map(async (parcel) => {
                parcel.statusHistory[0].timestamp = parcel.createdAt;
                await parcel.save();
                return parcel;
            })
        );

        res.status(201).json({
            success: true,
            message: "Thêm mới kiện hàng thành công!",
            createdParcels: updatedParcels,
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            error: error.message,
        });
    }
};

export const updateParcel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { trackingCode } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ID kiện hàng",
            });
        }

        if (trackingCode) {
            const existingCode = await Parcel.findOne({
                trackingCode,
                _id: { $ne: id },
            });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: "Mã kiện hàng đã tồn tại!",
                });
            }
        }

        const data = await Parcel.findByIdAndUpdate(id, req.body, { new: true });
        if (data) {
            return res.status(201).json({
                success: true,
                message: `Cập nhật kiện hàng thành công! ${trackingCode}`,
            });
        }
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật trạng thái thất bại",
            error: error.message,
        });
    }
};

export const updateParcelStatus = async (req, res, next) => {
    try {
        const { shipmentStatus, packageCode } = req.body;

        // Kiểm tra shipmentStatus có được cung cấp
        if (shipmentStatus === undefined || shipmentStatus === null) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn trạng thái",
            });
        }

        // Parse và kiểm tra shipmentStatus là số nguyên hợp lệ
        const status = parseInt(shipmentStatus, 10);
        if (isNaN(status) || !Number.isInteger(status) || status < 0 || status > 3) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ (phải là số nguyên từ 0 đến 3). Giá trị nhận được: ${shipmentStatus}`,
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp file Excel để cập nhật",
            });
        }
        if (!packageCode || packageCode.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp mã bao hợp lệ",
            });
        }

        const wk = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = wk.SheetNames[0];
        const sheet = wk.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        const updateData = data
            .slice(1)
            .map((row) => row[0]?.toString().trim())
            .filter((code) => code && code !== "");

        if (updateData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ít nhất một mã tracking trong file Excel",
            });
        }

        const allParcels = await Parcel.find({}, { trackingCode: 1 });
        const allowedTrackingCodes = allParcels.map((parcel) => parcel.trackingCode);

        const invalidTrackingCodes = updateData.filter(
            (code) => !allowedTrackingCodes.includes(code)
        );

        if (invalidTrackingCodes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Kiện hàng ${invalidTrackingCodes.join(", ")} không tồn tại trong kho hàng`,
                invalidTrackingCodes,
            });
        }

        const existingParcels = await Parcel.find({ trackingCode: { $in: updateData } });

        if (existingParcels.length !== updateData.length) {
            const foundTrackingCodes = existingParcels.map((parcel) => parcel.trackingCode);
            const notFoundTrackingCodes = updateData.filter(
                (code) => !foundTrackingCodes.includes(code)
            );
            return res.status(400).json({
                success: false,
                message: `Kiện hàng ${notFoundTrackingCodes.join(", ")} không tồn tại trong kho hàng`,
                notFoundTrackingCodes,
            });
        }

        const operations = [];
        for (const parcel of existingParcels) {
            // Bỏ qua kiện hàng đã giao
            if (parcel.shipmentStatus === 3) {
                continue;
            }


            // Kiểm tra shipmentStatus lớn hơn currentStatus đúng 1 đơn vị
            const expectedStatus = parcel.shipmentStatus + 1;
            if (status !== expectedStatus) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái phải lần lượt đúng vị trí`,
                });
            }

            operations.push({
                updateOne: {
                    filter: { trackingCode: parcel.trackingCode },
                    update: {
                        $set: { shipmentStatus: status, packageCode },
                        $push: {
                            statusHistory: {
                                status,
                                timestamp: new Date(),
                            },
                        },
                    },
                },
            });
        }

        if (operations.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Không có kiện hàng nào có thể cập nhật (tất cả đã ở trạng thái Đã giao)",
                updatedCount: 0,
            });
        }

        const result = await Parcel.bulkWrite(operations);

        res.status(200).json({
            success: false,
            message: "Cập nhật trạng thái kiện hàng thành công!",
            updatedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật trạng thái thất bại",
            error: error.message,
        });
    }
};

export const toggleParcelInspection = async (req, res, next) => {
    try {
        // Kiểm tra xem có file Excel được cung cấp không
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp file Excel để cập nhật",
            });
        }

        // Đọc file Excel
        const wk = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = wk.SheetNames[0];
        const sheet = wk.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        // Lấy danh sách trackingCode từ file Excel
        const updateData = data
            .slice(1)
            .map((row) => row[0]?.toString().trim())
            .filter((code) => code && code !== "");

        if (updateData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ít nhất một mã tracking trong file Excel",
            });
        }

        // Kiểm tra xem tất cả trackingCode có tồn tại trong database không
        const allParcels = await Parcel.find({}, { trackingCode: 1 });
        const allowedTrackingCodes = allParcels.map((parcel) => parcel.trackingCode);

        const invalidTrackingCodes = updateData.filter(
            (code) => !allowedTrackingCodes.includes(code)
        );

        if (invalidTrackingCodes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Kiện hàng ${invalidTrackingCodes.join(", ")} không tồn tại trong kho hàng`,
                invalidTrackingCodes,
            });
        }

        // Lấy các kiện hàng cần cập nhật
        const existingParcels = await Parcel.find({ trackingCode: { $in: updateData } });

        if (existingParcels.length !== updateData.length) {
            const foundTrackingCodes = existingParcels.map((parcel) => parcel.trackingCode);
            const notFoundTrackingCodes = updateData.filter(
                (code) => !foundTrackingCodes.includes(code)
            );
            return res.status(400).json({
                success: false,
                message: `Kiện hàng ${notFoundTrackingCodes.join(", ")} không tồn tại trong kho hàng`,
                notFoundTrackingCodes,
            });
        }

        // Tạo danh sách operations để cập nhật inspection
        const operations = existingParcels.map((parcel) => ({
            updateOne: {
                filter: { trackingCode: parcel.trackingCode },
                update: {
                    $set: { inspection: !parcel.inspection }, // Đảo ngược giá trị inspection
                },
            },
        }));

        if (operations.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Không có kiện hàng nào để cập nhật",
                updatedCount: 0,
            });
        }

        // Thực hiện bulk update
        const result = await Parcel.bulkWrite(operations);

        res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái kiểm tra kiện hàng thành công!",
            updatedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật trạng thái kiểm tra thất bại",
            error: error.message,
        });
    }
};

export const removeParcel = async (req, res, next) => {
    try {
        const data = await Parcel.findByIdAndDelete(req.params.id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy don hang với id này để xóa!",
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa don hang thành công!",
            data,
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Xóa don hang thất bại!",
            error: error.message,
        });
    }
}
export const assignToParcel = async (req, res, next) => {
    try {
        const { trackingCode, customerCode } = req.body;

        const customer = await Customer.findOne({ customerCode });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng",
            });
        }

        const parcel = await Parcel.findOne({ trackingCode });
        if (!parcel) {
            return res.status(404).json({
                success: false,
                message: `Không tìm thấy kiện hàng với trackingCode: ${trackingCode}`,
            });
        }

        let oldCustomer = null
        if (parcel.customer) {
            oldCustomer = await Customer.findById(parcel.customer)
            if (oldCustomer) {
                oldCustomer.parcels = oldCustomer.parcels.filter(
                    (p) => p.toString() !== parcel._id.toString()
                )
            }
        }

        parcel.customer = customer._id;

        if (!customer.parcels) {
            customer.parcels = [];
        }

        if (
            !customer.parcels.some((p) => p && p.toString() === parcel._id.toString())
        ) {
            customer.parcels.push(parcel._id);
        }

        const savePromises = [parcel.save(), customer.save()];
        if (oldCustomer) {
            savePromises.push(oldCustomer.save());
        }
        await Promise.all(savePromises);

        res.status(201).json({
            success: true,
            message: "Gán khách hàng cho kiện hàng thành công!",
            parcel,
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            error: error.message,
        });
    }
};

