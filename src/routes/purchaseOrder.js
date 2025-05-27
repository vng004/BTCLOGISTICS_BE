import { Router } from "express";
import { addPurchaseOrder, getPurchaseOrderById, getPurchaseOrderByOrderCode, getPurchaseOrders, removePurchaseOrder, updatePurchaseOrder } from "../controllers/purchaseOrder.js";


const routePurchaseOrder = Router()

routePurchaseOrder.get('/', getPurchaseOrders)
routePurchaseOrder.get('/:id', getPurchaseOrderById)
routePurchaseOrder.post('/code', getPurchaseOrderByOrderCode)
routePurchaseOrder.post('/', addPurchaseOrder)
routePurchaseOrder.patch('/:id', updatePurchaseOrder)
routePurchaseOrder.delete('/:id', removePurchaseOrder)

export default routePurchaseOrder