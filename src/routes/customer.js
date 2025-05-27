import { Router } from "express";
import { addCustomer, checkCustomerCode, getCustomer, getCustomerById, removeCustomer, updateCustomer } from "../controllers/customer.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { customerSchema } from "../validations/customer.js";
import { checkAuth, checksuperAdmin } from "../middlewares/checkAuth.js";
const routeCustomer = Router()

routeCustomer.use(checkAuth)


routeCustomer.get('/:id', getCustomerById)
routeCustomer.post('/check', checkCustomerCode)
routeCustomer.post('/', validateRequest(customerSchema), addCustomer);

routeCustomer.use(checksuperAdmin)
routeCustomer.get('/', getCustomer)
routeCustomer.patch('/:id', validateRequest(customerSchema), updateCustomer)
routeCustomer.delete('/:id', removeCustomer)


export default routeCustomer