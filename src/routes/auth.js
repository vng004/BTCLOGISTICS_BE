import { Router } from 'express'
import { createAdmin, deleteUser, getAuth, getAuthById, Login, updateAuth } from '../controllers/auth.js'
import { validateRequest } from '../middlewares/validateRequest.js'
import authSchema from '../validations/auth.js'
import { checkAuth, checksuperAdmin } from '../middlewares/checkAuth.js'

const routeAuth = Router()

routeAuth.post('/login', Login)

routeAuth.use(validateRequest(authSchema))
routeAuth.post('/create-admin', createAdmin)

routeAuth.use(checkAuth)
routeAuth.use(checksuperAdmin)

routeAuth.get("/", getAuth);
routeAuth.get("/:id", getAuthById);
routeAuth.patch("/:id", updateAuth);

routeAuth.delete("/:id", deleteUser);
export default routeAuth