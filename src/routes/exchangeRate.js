import { Router } from "express";
import { addExchangeRate, updateExchangeRate, getExchangeRate } from "../controllers/exchangeRate.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import exchangeRateSchema from "../validations/exchangeRate.js";
import { checkAuth, checksuperAdmin } from "../middlewares/checkAuth.js";

const routeExchangeRate = Router()

routeExchangeRate.get('', getExchangeRate)

routeExchangeRate.use(checkAuth)
routeExchangeRate.use(checksuperAdmin)

routeExchangeRate.use(validateRequest(exchangeRateSchema))
routeExchangeRate.post('/', addExchangeRate);
routeExchangeRate.patch('/', updateExchangeRate)
export default routeExchangeRate