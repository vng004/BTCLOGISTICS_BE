import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Auth from "../models/Auth.js";

export const Login = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        if (!userName || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp đầy đủ tên người dùng và mật khẩu",
            });
        }

        const user = await Auth.findOne({ userName });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản không tồn tại!",
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu không đúng!",
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.status(200).json({
            success: true,
            message: "Đăng nhập tài khoản thành công!",
            token,
            user: {
                id: user._id,
                userName: user.userName,
                role: user.role,
            },
        });
    } catch (error) {
        console.log(error)
        next({
            status: 500,
            success: false,
            message: "Đăng nhập tài khoản thất bại!",
            error: error.message,
        });
    }
};

export const createAdmin = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        const existingUser = await Auth.findOne({ userName });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Tên người dùng đã tồn tại!",
            });
        }

        const userCount = await Auth.countDocuments();
        const role = userCount === 0 ? "superAdmin" : "admin";

        const newUser = new Auth({
            userName,
            password,
            plainPassword: password,
            role,
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "Tạo tài khoản admin thành công!",
            data: {
                id: newUser._id,
                userName: newUser.userName,
                role: newUser.role,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            },
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Tạo tài khoản admin thất bại!",
            error: error.message,
        });
    }
};

export const getAuth = async (req, res, next) => {
    try {
        const users = await Auth.find({})
            .select("+plainPassword")
            .sort({ createdAt: 1 });

        const responseUsers = users.map((user) => {
            return {
                id: user._id,
                userName: user.userName,
                role: user.role,
                password: user.password,
                plainPassword: user.plainPassword,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        });

        res.status(200).json({
            success: true,
            message: "Lấy danh sách người dùng thành công!",
            users: responseUsers,
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Lấy thông tin người dùng thất bại!",
            error: error.message,
        });
    }
};

export const getAuthById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ID người dùng",
            });
        }

        const user = await Auth.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng với ID này!",
            });
        }

        // Kiểm tra vai trò của người dùng hiện tại
        const isSuperAdmin = req.user?.role === "superAdmin";

        // Nếu là superAdmin, trả về password
        const responseUser = {
            id: user._id,
            userName: user.userName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            ...(isSuperAdmin && { password: user.password }), // Chỉ thêm password nếu là superAdmin
        };

        res.status(200).json({
            success: true,
            message: "Lấy thông tin người dùng thành công!",
            user: responseUser,
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Lấy thông tin người dùng thất bại!",
            error: error.message,
        });
    }
};

export const updateAuth = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp ID người dùng",
            });
        }

        const user = await Auth.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng với ID này!",
            });
        }
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const data = await Auth.findByIdAndUpdate(req.params.id, updateData, { new: true })

        res.status(200).json({
            success: true,
            message: "Cập nhật vai trò người dùng thành công!",
            data
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Cập nhật vai trò người dùng thất bại!",
            error: error.message,
        });
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await Auth.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Tài khoản không tồn tại!",
            });
        }

        //   if (user.role === "superAdmin") {
        //     return res.status(403).json({
        //       success: false,
        //       message: "Không thể xóa tài khoản Super Admin!",
        //     });
        //   }

        // Xóa tài khoản
        await Auth.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Xóa tài khoản thành công!",
        });
    } catch (error) {
        console.error(error);
        next({
            status: 500,
            success: false,
            message: "Xóa tài khoản thất bại!",
            error: error.message,
        });
    }
};