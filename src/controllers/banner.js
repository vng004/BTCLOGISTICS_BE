import Banner from "../models/Banner.js";

export const addBanner = async (req, res, next) => {
    try {
        const { images, isActive } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ success: false, message: "Cần ít nhất một hình ảnh" });
        }

        const banner = new Banner({ images, isActive });
        const savedBanner = await banner.save();
        res.status(201).json({ success: true, message: "Tạo banner thành công", data: savedBanner });
    } catch (error) {
        next({ status: 500, success: false, message: "Tạo banner thất bại", error: error.message });
    }
};

export const getActiveBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findOne({ isActive: true })
            .sort({ createdAt: -1 });
        if (!banner) {
            return res.status(200).json({ success: true, message: "Không có banner hoạt động", data: null });
        }
        res.status(200).json({ success: true, message: "Lấy banner thành công", data: banner });
    } catch (error) {
        next({ status: 500, success: false, message: "Lấy banner thất bại", error: error.message });
    }
};

export const getAllBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, message: "Lấy danh sách banner thành công", data: banners });
    } catch (error) {
        next({ status: 500, success: false, message: "Lấy danh sách thất bại", error: error.message });
    }
};

export const updateBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { images, isActive } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ success: false, message: "Cần ít nhất một hình ảnh" });
        }

        const banner = await Banner.findByIdAndUpdate(
            id,
            { images, isActive },
            { new: true }
        );
        if (!banner) {
            return res.status(404).json({ success: false, message: "Không tìm thấy banner" });
        }
        res.status(200).json({ success: true, message: "Cập nhật banner thành công", data: banner });
    } catch (error) {
        next({ status: 500, success: false, message: "Cập nhật thất bại", error: error.message });
    }
};

export const removeBanner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Không tìm thấy banner" });
        }
        res.status(200).json({ success: true, message: "Xóa banner thành công", data: banner });
    } catch (error) {
        next({ status: 500, success: false, message: "Xóa thất bại", error: error.message });
    }
};