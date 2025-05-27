import routeAuth from "./auth.js";
import routeBanner from "./banner.js";
import routeCustomer from "./customer.js";
import routeExchangeRate from "./exchangeRate.js";
import routeOrderSucces from "./orderSucces.js";
import routeParcel from "./parcel.js";
import routePurchaseOrder from "./purchaseOrder.js";

export function router(app) {
    app.use("/api/parcel", routeParcel)
    app.use("/api/exchange-rate", routeExchangeRate)
    app.use("/api/auth", routeAuth)
    app.use("/api/customer", routeCustomer)
    app.use("/api/banner", routeBanner)
    app.use("/api/order-succes", routeOrderSucces)
    app.use("/api/purchase-order", routePurchaseOrder)
} 