import Customer from "../models/Customer.js"
export const getCustomer = async (req, res, next) => {
    try {
        const { page = 1, per_page = 6, keyword = "" } = req.query
        const query = {}

        const Page = parseInt(page);
        const perPage = parseInt(per_page);
        const skip = (Page - 1) * perPage;

        if (keyword) {
            query.cutomerCode = { $regex: keyword, $options: 'i' }
        }

        const total = await Customer.countDocuments(query)

        const data = await Customer.find(query).skip(skip).limit(perPage).populate("parcels.parcel").populate("ordersuccess").sort({ createdAt: -1 });


        res.status(201).json({
            success: true,
            message: "Lấy dữ liệu khách hàng thành công",
            data,
            meta: {
                total,
                page: Page,
                per_page: perPage,
                totalPages: Math.ceil(total / perPage)
            }
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Lấy dữ liệu thất bại",
            error: error.message
        });
    }
}

export const getCustomerById = async (req, res, next) => {
    try {
        const { id } = req.params
        
        const data = await Customer.findById(id).populate("parcels").populate("")
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng với ID này"
            });
        }
        res.status(201).json({
            success: true,
            message: "Lấy dữ liệu khách hàng thành công",
            data
        });
    } catch (error) {
        console.log(error)
        next({
            status: 500,
            success: false,
            message: "Lấy dữ liệu thất bại",
            error: error.message
        });
    }
}

export const addCustomer = async (req, res, next) => {
    try {
        const { customerCode, email } = req.body

        if (customerCode) {
            const existingCode = await Customer.findOne({ customerCode });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: "Mã khách hàng đã tồn tại"
                });
            }
        }
        if (email) {
            const existingEmail = await Customer.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email này đã tồn tại"
                });
            }
        }
        const data = await Customer.create(req.body)

        res.status(201).json({
            success: true,
            message: "Thêm khách hàng thành công",
            data
        });
    } catch (error) {
        console.log(error)
        next({
            status: 500,
            success: false,
            message: "Lấy dữ liệu thất bại",
            error: error.message
        });
    }
}

export const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { customerCode, email } = req.body

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ID khách hàng"
            });
        }


        if (customerCode) {
            const existingCode = await Customer.findOne({ customerCode });
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: "Mã khách hàng đã tồn tại"
                });
            }
        }
        if (email) {
            const existingEmail = await Customer.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email này đã tồn tại"
                });
            }
        }

        const data = await Customer.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách hàng với ID này"
            });
        }

        res.status(201).json({
            success: true,
            message: "Cập nhật khách hàng thành công",
            data
        });
    } catch (error) {
        console.error("Error in updateCustomer:", error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật khách hàng thất bại",
            error: error.message
        });
    }
};

export const removeCustomer = async (req, res, next) => {
    try {

        const id = req.params.id
        const customer = await Customer.findById(id)

        if (customer.parcels && customer.parcels.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa khách hàng vì vẫn còn kiện hàng liên quan",
            });
        }

        const data = await Customer.findByIdAndDelete(req.params.id)

        res.status(201).json({
            success: true,
            message: "Xoa dữ liệu khách hàng thành công",
            data
        });
    } catch (error) {
        next({
            status: 500,
            success: false,
            message: "Xoa dữ liệu thất bại",
            error: error.message
        });
    }
}

export const checkCustomerCode = async (req, res, next) => {
    try {
        const { customerCode } = req.body;
        if (!customerCode) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp mã khách hàng",
            });
        }

        const customer = await Customer.findOne({ customerCode }).select("customerCode fullName phone email");
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Mã khách hàng không tồn tại",
            });
        }

        res.status(200).json({
            success: true,
            message: "Mã khách hàng hợp lệ",
            data: {
                customerCode: customer.customerCode,
                fullName: customer.fullName || "",
                phone: customer.phone || "",
                email: customer.email || "",
            },
        });
        console.log(customer)
    } catch (error) {
        console.log(error)
        next({
            status: 500,
            success: false,
            message: "Kiểm tra mã khách hàng thất bại",
            error: error.message,
        });
    }
};