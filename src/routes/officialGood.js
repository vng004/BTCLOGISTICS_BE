import { Router } from "express";
import { addOfficialGood, getOfficialGood, getOfficialGoodById, removeOfficialGood, updateOfficialGood } from "../controllers/officialGood.js";

const routeOfficialGood = Router()
routeOfficialGood.get('/', getOfficialGood)
routeOfficialGood.get('/:id', getOfficialGoodById)
routeOfficialGood.post('/', addOfficialGood)
routeOfficialGood.patch('/:id', updateOfficialGood)
routeOfficialGood.delete('/:id', removeOfficialGood)

export default routeOfficialGood