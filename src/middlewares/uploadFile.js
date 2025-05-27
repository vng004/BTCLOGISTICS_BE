// uploadMiddleware.js
import multer from 'multer';

// Cấu hình Multer để lưu trữ file vào bộ nhớ
const storage = multer.memoryStorage();

// Cấu hình Multer
const uploadFile = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn kích thước file tối đa là 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Chỉ hỗ trợ file Excel.'));
        }
        cb(null, true);
    }
});

export default uploadFile;
