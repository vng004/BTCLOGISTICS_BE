import { Router } from "express";
import { addParcel, assignToParcel, getParcel, getParcelById, removeParcel, toggleParcelInspection, updateParcel, updateParcelStatus } from "../controllers/parcel.js";
import { checkAuth, checksuperAdmin } from "../middlewares/checkAuth.js";
import uploadFile from "../middlewares/uploadFile.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { assignCustomerSchema } from "../validations/customer.js";
import { parcelSchema, updateParcelStatusSchema } from "../validations/parcels.js";


const routeParcel = Router()

routeParcel.get('/', getParcel)

routeParcel.use(checkAuth)
routeParcel.patch('/:id', updateParcel)
routeParcel.get('/:id', getParcelById)
routeParcel.post('/assignToParcel', validateRequest(assignCustomerSchema), assignToParcel);

routeParcel.use(checksuperAdmin)
routeParcel.post('/import-add', validateRequest(parcelSchema), uploadFile.single('file'), addParcel);
routeParcel.post('/import-update', validateRequest(updateParcelStatusSchema), uploadFile.single('file'), updateParcelStatus);
routeParcel.post('/toggle-inspection', validateRequest(updateParcelStatusSchema), uploadFile.single('file'), toggleParcelInspection);
routeParcel.delete('/:id', removeParcel)
export default routeParcel 