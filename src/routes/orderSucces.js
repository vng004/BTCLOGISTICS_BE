import { Router } from "express";
import { addParcelsForOrderSucces, getOrderSucces, getOrderSuccesById, removeOrderSuccesById, updateOrderSuccesById } from "../controllers/orderSucces.js";

const routeOrderSucces = Router()
routeOrderSucces.post('/pdf', addParcelsForOrderSucces)
routeOrderSucces.get('/', getOrderSucces)
routeOrderSucces.get('/:id', getOrderSuccesById)
routeOrderSucces.patch('/:id', updateOrderSuccesById)
routeOrderSucces.delete('/:id', removeOrderSuccesById)
export default routeOrderSucces