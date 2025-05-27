import jwt from 'jsonwebtoken'
export const checksuperAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Bạn không có quyền truy cập"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "superAdmin") {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn không có quyền thực hiện hành động này"
            });
        }
        req.user = decoded.user;
        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
            error: error.message
        });
    }
}

export const checkAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Bạn không có quyền truy cập"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userRole = decoded.role
        console.log(userRole)
        if (!["admin", "superAdmin"].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản của bạn không có quyền thực hiện hành động này"
            });
        }
        req.user = decoded.user;
        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ",
            error: error.message
        });
    }
}