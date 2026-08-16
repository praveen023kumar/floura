import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", AdminController.login);
router.get("/users", requireAdminAuth, AdminController.listAdmins);
router.post("/users", requireAdminAuth, AdminController.createAdmin);
router.get("/users/count", requireAdminAuth, AdminController.getUsersCount);

export default router;
