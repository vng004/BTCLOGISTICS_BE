import Customer from "../models/Customer.js";
import OrderSucces from "../models/OrderSucces.js"
import Parcel from "../models/Parcel.js";

export const addParcelsForOrderSucces = async (req, res, next) => {
  try {
    const { trackingCode } = req.body;
    if (!trackingCode || !Array.isArray(trackingCode) || trackingCode.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp danh sách trackingCode hợp lệ"
      });
    }

    const selectedParcels = await Parcel.find({ trackingCode: { $in: trackingCode } })
      .populate("customer", "customerCode fullName");

    if (selectedParcels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kiện hàng nào với trackingCode đã cung cấp"
      });
    }

    const firstCustomerId = selectedParcels[0].customer?._id;
    const allSameCustomer = selectedParcels.every(parcel =>
      parcel.customer && parcel.customer._id.equals(firstCustomerId)
    );
    const weight = selectedParcels.some(p => p.weight <= 0)
    if (weight) {
      return res.status(400).json({
        success: false,
        message: "Cân nặng kiện hàng = 0. Bổ sung cân nặng của kiện hàng để xuất kho."
      });
    }
    if (!allSameCustomer) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc nhiều kiện hàng không có hoặc không thuộc cùng một khách hàng"
      });
    }

    // Kiểm tra các trường bắt buộc trong parcels
    const invalidParcels = selectedParcels.some(p => !p.trackingCode || !p.weight);
    if (invalidParcels) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc nhiều kiện hàng thiếu trường trackingCode hoặc weight"
      });
    }

    const customer = selectedParcels[0].customer;

    // Tính actualCubicMeter cho mỗi parcel và tạo parcelData
    const parcelData = selectedParcels.map(p => {
      const length = parseFloat(p.length) || 0;
      const width = parseFloat(p.width) || 0;
      const height = parseFloat(p.height) || 0;
      const quantity = 1; // Mặc định là 1, khớp với schema

      // Tính actualCubicMeter: (D * R * C) / 1000000 * quantity
      const actualCubicMeterRaw = (length * width * height) / 1000000 * quantity;
      // Làm tròn lên actualCubicMeter đến 3 chữ số thập phân
      const actualCubicMeter = Math.ceil(actualCubicMeterRaw * 1000) / 1000;

      // Tính actualWeight: weight * quantity
      const weight = parseFloat(p.weight) || 0;
      const actualWeightRaw = weight * quantity;
      // Làm tròn lên actualWeight đến 2 chữ số thập phân
      const actualWeight = Math.ceil(actualWeightRaw * 100) / 100;

      return {
        trackingCode: p.trackingCode,
        weight: p.weight,
        quantity: quantity,
        actualCubicMeter: actualCubicMeter.toString().replace('.', ','), // Định dạng với dấu phẩy
        actualWeight: actualWeight.toString(),
        length: p.length || "0",
        width: p.width || "0",
        height: p.height || "0",
      };
    });

    // Tính totalActualWeight1: Tổng actualCubicMeter của các parcel
    const totalActualWeight1Raw = parcelData
      .reduce((sum, p) => {
        const cubicMeter = parseFloat(p.actualCubicMeter.replace(',', '.')) || 0;
        return sum + cubicMeter;
      }, 0);
    // Làm tròn lên totalActualWeight1 đến 3 chữ số thập phân
    const totalActualWeight1 = Math.ceil(totalActualWeight1Raw * 1000) / 1000;

    // Tính totalActualWeight2: Tổng actualWeight của các parcel
    const totalActualWeight2Raw = parcelData
      .reduce((sum, p) => {
        const weight = parseFloat(p.actualWeight) || 0;
        return sum + weight;
      }, 0);
    // Làm tròn lên totalActualWeight2 đến 2 chữ số thập phân
    const totalActualWeight2 = Math.ceil(totalActualWeight2Raw * 100) / 100;

    const totalActualWeight = {
      totalActualWeight1: totalActualWeight1.toString(),
      totalActualWeight2: totalActualWeight2.toString(),
    };

    // Lấy các giá trị từ req.body, nếu không có thì gán mặc định
    const { transportFeeRate1 = "0", transportFeeRate2 = "0" } = req.body;
    const transportFeeNoteRaw = req.body.transportFeeNote || "0";
    const importEntrustmentFeeRaw = req.body.importEntrustmentFee || "0";
    const shipFeeNoteRaw = req.body.shipFeeNote || "0";
    const customServicesRaw = req.body.customServices || [];

    // Định dạng tiền tệ cho các giá trị phí
    const transportFeeNote = parseFloat(transportFeeNoteRaw).toLocaleString('en-US', { minimumFractionDigits: 0 });
    const importEntrustmentFee = parseFloat(importEntrustmentFeeRaw).toLocaleString('en-US', { minimumFractionDigits: 0 });
    const shipFeeNote = parseFloat(shipFeeNoteRaw).toLocaleString('en-US', { minimumFractionDigits: 0 });

    // Định dạng tiền tệ cho customServices
    const customServices = customServicesRaw.map(service => ({
      name: service.name?.toString() || "",
      value: parseFloat(service.value || "0").toLocaleString('en-US', { minimumFractionDigits: 0 }),
    }));

    // Tính tổng value của customServices
    const totalCustomServicesRaw = customServicesRaw
      .reduce((sum, service) => {
        const value = parseFloat(service.value) || 0;
        return sum + value;
      }, 0);
    // Làm tròn lên totalCustomServices đến 0 chữ số thập phân (số nguyên)
    const totalCustomServices = Math.ceil(totalCustomServicesRaw);

    // Tính totalAmount
    const totalAmountRaw = (
      (parseFloat(totalActualWeight1) || 0) * (parseFloat(transportFeeRate1) || 0) +
      (parseFloat(totalActualWeight2) || 0) * (parseFloat(transportFeeRate2) || 0) +
      (parseFloat(transportFeeNoteRaw) || 0) + // Sử dụng giá trị gốc để tính toán
      (parseFloat(importEntrustmentFeeRaw) || 0) +
      (parseFloat(shipFeeNoteRaw) || 0) +
      totalCustomServices
    );
    // Làm tròn lên totalAmount đến 0 chữ số thập phân (số nguyên)
    const totalAmountNum = Math.ceil(totalAmountRaw);
    // Định dạng totalAmount với dấu chấm
    const totalAmount = totalAmountNum.toLocaleString('en-US', { minimumFractionDigits: 0 });

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const exportCode = `${year}${month}${day}-GGK-${customer.customerCode}`;

    const orderData = {
      exportCode: exportCode,
      parcelInformation: req.body.parcelInformation || "",
      customer: firstCustomerId,
      exportDate: new Date(),
      parcels: parcelData,
      totalActualWeight,
      transportFeeRate: {
        transportFeeRate1,
        transportFeeRate2,
      },
      transportFeeNote,
      importEntrustmentFee,
      shipFeeNote,
      customServices,
      totalAmount: totalAmount,
    };

    const newOrderSucces = new OrderSucces(orderData);
    await newOrderSucces.save();

    res.status(200).json({
      success: true,
      message: "Chuyển dữ liệu thành công",
      data: newOrderSucces,
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "Chuyển dữ liệu thất bại",
      error: error.message,
    });
  }
};

export const updateOrderSuccesById = async (req, res, next) => {
  try {
    // Lấy dữ liệu OrderSucces trước khi cập nhật
    const existingOrder = await OrderSucces.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy OrderSucces với ID đã cung cấp',
      });
    }

    // Lấy dữ liệu parcels từ req.body, nếu không có thì dùng parcels hiện tại
    const parcels = req.body.parcels || existingOrder.parcels;

    // Kiểm tra các trường bắt buộc trong parcels
    const invalidParcels = parcels.some((p) => !p.trackingCode || !p.weight);
    if (invalidParcels) {
      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều kiện hàng thiếu trường trackingCode hoặc weight',
      });
    }

    // Tính actualCubicMeter và giữ actualWeight từ req.body cho mỗi parcel
    const updatedParcels = parcels.map((p) => {
      const length = parseFloat(p.length) || 0;
      const width = parseFloat(p.width) || 0;
      const height = parseFloat(p.height) || 0;
      const quantity = parseInt(p.quantity) || 1;
      const weight = parseFloat(p.weight) || 0;

      // Tính actualCubicMeter: (D * R * C) / 1000000 * quantity
      const actualCubicMeterRaw = ((length * width * height) / 1000000) * quantity;
      // Làm tròn lên actualCubicMeter đến 3 chữ số thập phân
      const actualCubicMeter = Math.ceil(actualCubicMeterRaw * 1000) / 1000;

      // Sử dụng actualWeight từ req.body nếu có, nếu không thì lấy từ existingOrder hoặc tính toán
      const actualWeightRaw = p.actualWeight
        ? parseFloat(p.actualWeight.replace(',', '.')) // Xử lý dấu phẩy nếu có
        : (existingOrder.parcels.find((ep) => ep.trackingCode === p.trackingCode)?.actualWeight
          ? parseFloat(existingOrder.parcels.find((ep) => ep.trackingCode === p.trackingCode).actualWeight)
          : weight * quantity); // Tính toán nếu không có giá trị

      // Làm tròn lên actualWeight đến 2 chữ số thập phân
      const actualWeight = Math.ceil(actualWeightRaw * 100) / 100;

      return {
        ...p,
        quantity,
        actualCubicMeter, // Giữ số thô
        actualWeight, // Giữ số thô
      };
    });

    // Tính totalActualWeight1: Tổng actualCubicMeter của các parcel
    const totalActualWeight1Raw = updatedParcels.reduce((sum, p) => {
      return sum + (parseFloat(p.actualCubicMeter) || 0);
    }, 0);
    // Làm tròn lên totalActualWeight1 đến 3 chữ số thập phân
    const totalActualWeight1 = Math.ceil(totalActualWeight1Raw * 1000) / 1000;

    // Tính totalActualWeight2: Tổng actualWeight của các parcel
    const totalActualWeight2Raw = updatedParcels.reduce((sum, p) => {
      return sum + (parseFloat(p.actualWeight) || 0);
    }, 0);
    // Làm tròn lên totalActualWeight2 đến 2 chữ số thập phân
    const totalActualWeight2 = Math.ceil(totalActualWeight2Raw * 100) / 100;

    // Cập nhật totalActualWeight
    const totalActualWeight = {
      totalActualWeight1,
      totalActualWeight2,
    };

    // Lấy các giá trị từ req.body, nếu không có thì dùng giá trị hiện tại
    const transportFeeRate =
      req.body.transportFeeRate || existingOrder.transportFeeRate || { transportFeeRate1: 0, transportFeeRate2: 0 };
    const transportFeeNoteRaw =
      req.body.transportFeeNote !== undefined ? req.body.transportFeeNote : existingOrder.transportFeeNote || 0;
    const importEntrustmentFeeRaw =
      req.body.importEntrustmentFee !== undefined ? req.body.importEntrustmentFee : existingOrder.importEntrustmentFee || 0;
    const shipFeeNoteRaw =
      req.body.shipFeeNote !== undefined ? req.body.shipFeeNote : existingOrder.shipFeeNote || 0;
    const customServicesRaw =
      req.body.customServices !== undefined ? req.body.customServices : existingOrder.customServices || [];

    // Định dạng customServices
    const customServices = customServicesRaw.map((service) => ({
      name: service.name?.toString() || '',
      value: parseFloat(service.value.toString().replace(',', '.')) || 0, // Chuyển thành số thô
    }));

    // Tính tổng value của customServices
    const totalCustomServicesRaw = customServices.reduce((sum, service) => {
      return sum + (service.value || 0);
    }, 0);
    // Làm tròn lên totalCustomServices đến 0 chữ số thập phân (số nguyên)
    const totalCustomServices = Math.ceil(totalCustomServicesRaw);

    // Tính totalAmount
    const totalAmountRaw =
      (totalActualWeight1 || 0) * (parseFloat(transportFeeRate.transportFeeRate1.toString().replace(',', '.')) || 0) +
      (totalActualWeight2 || 0) * (parseFloat(transportFeeRate.transportFeeRate2.toString().replace(',', '.')) || 0) +
      (parseFloat(transportFeeNoteRaw.toString().replace(',', '.')) || 0) +
      (parseFloat(importEntrustmentFeeRaw.toString().replace(',', '.')) || 0) +
      (parseFloat(shipFeeNoteRaw.toString().replace(',', '.')) || 0) +
      totalCustomServices;
    // Làm tròn lên totalAmount đến 0 chữ số thập phân (số nguyên)
    const totalAmount = Math.ceil(totalAmountRaw);

    // Cập nhật dữ liệu với các giá trị đã tính toán
    const updatedData = {
      ...req.body,
      parcels: updatedParcels,
      totalActualWeight,
      transportFeeRate: {
        transportFeeRate1: parseFloat(transportFeeRate.transportFeeRate1.toString().replace(',', '.')) || 0,
        transportFeeRate2: parseFloat(transportFeeRate.transportFeeRate2.toString().replace(',', '.')) || 0,
      },
      transportFeeNote: parseFloat(transportFeeNoteRaw.toString().replace(',', '.')) || 0,
      importEntrustmentFee: parseFloat(importEntrustmentFeeRaw.toString().replace(',', '.')) || 0,
      shipFeeNote: parseFloat(shipFeeNoteRaw.toString().replace(',', '.')) || 0,
      customServices,
      totalAmount,
    };

    const data = await OrderSucces.findByIdAndUpdate(req.params.id, { $set: updatedData }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Cập nhật OrderSucces thành công',
      data,
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: 'Cập nhật OrderSucces thất bại',
      error: error.message,
    });
  }
};

export const getOrderSucces = async (req, res, next) => {
  try {
    const { keyword = "", page = 1, per_page = 10, exportCode, start_date, end_date, customerCode } = req.query;

    const pageNum = parseInt(page, 10);
    const perPageNum = parseInt(per_page, 10);

    if (isNaN(pageNum) || isNaN(perPageNum) || pageNum < 1 || perPageNum < 1) {
      return res.status(400).json({
        success: false,
        message: "page và per_page phải là số lớn hơn 0",
      });
    }

    let query = {};
    if (customerCode) {
      const customers = await Customer.find({ customerCode: { $regex: customerCode, $options: 'i' } });
      const customerIds = customers.map(customer => customer._id);
      query.customer = { $in: customerIds };
    } else if (keyword) {
      const customers = await Customer.find({ customerCode: { $regex: keyword, $options: 'i' } });
      const customerIds = customers.map(customer => customer._id);
      query.customer = { $in: customerIds };
    }

    if (exportCode) {
      query.exportCode = { $regex: exportCode, $options: 'i' };
    }

    if (start_date || end_date) {
      query.exportDate = {};
      if (start_date) query.exportDate.$gte = new Date(start_date);

      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999); // Đặt giờ là 23:59:59.999
        query.exportDate.$lte = endDate;
      }
    }


    const total = await OrderSucces.countDocuments(query);

    const skip = (pageNum - 1) * perPageNum;
    const data = await OrderSucces.find(query)
      .sort({ exportDate: -1 })
      .skip(skip)
      .limit(perPageNum)
      .populate("customer", "customerCode fullName");

    // Tính tổng totalAmount, giữ giá trị thô
    const totalAmountResult = await OrderSucces.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $convert: {
                input: { $replaceAll: { input: "$totalAmount", find: ".", replacement: "" } },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]);
    const totalAmount = totalAmountResult[0]?.totalAmount || 0; // Giữ giá trị thô

    const totalPages = Math.ceil(total / perPageNum);

    res.status(200).json({
      success: true,
      data,
      meta: {
        total,
        totalPages,
        currentPage: pageNum,
        perPage: perPageNum,
        totalAmount,
      },
    });
  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "Lấy danh sách OrderSucces thất bại",
      error: error.message || "Lỗi không xác định",
    });
  }
};


export const getOrderSuccesById = async (req, res, next) => {
  try {
    const id = req.params.id
    const data = await OrderSucces.findById(id).populate("customer")

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    console.error(error);
    next({
      status: 500,
      success: false,
      message: "Lấy danh sách OrderSucces thất bại",
      error: error.message,
    });
  }
}

export const removeOrderSuccesById = async (req, res, next) => {
  try {
    const id = req.params.id
    await OrderSucces.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      message: "Xóa danh sách OrderSucces thành công",
    });

  } catch (error) {
    next({
      status: 500,
      success: false,
      message: "Lấy danh sách OrderSucces thất bại",
      error: error.message,
    });
  }
}

