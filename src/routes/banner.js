import { Router } from 'express';
import { addBanner, removeBanner, getActiveBanner, getAllBanners, updateBanner } from '../controllers/banner.js';
import { checkAuth, checksuperAdmin } from '../middlewares/checkAuth.js';
const routeBanner = Router()

routeBanner.get("/active", getActiveBanner); 
routeBanner.use(checkAuth); 
routeBanner.use(checksuperAdmin)

routeBanner.get("/", getAllBanners);
routeBanner.post("/", addBanner);
routeBanner.patch("/:id", updateBanner);
routeBanner.delete("/:id", removeBanner);

export default routeBanner
