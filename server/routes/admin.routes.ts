import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import { requireAdminAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", AdminController.login);
router.get("/users", requireAdminAuth, AdminController.listAdmins);
router.post("/users", requireAdminAuth, AdminController.createAdmin);
router.get("/users/count", requireAdminAuth, AdminController.getUsersCount);
router.get("/registered-users", requireAdminAuth, AdminController.getRegisteredUsers);
router.patch("/registered-users/:email/status", requireAdminAuth, AdminController.toggleUserStatusHandler);
router.put("/registered-users/:email/expiry", requireAdminAuth, AdminController.updateUserExpiryHandler);
router.patch("/registered-users/:email/expiry", requireAdminAuth, AdminController.updateUserExpiryHandler);
router.post("/registered-users/:email/expiry", requireAdminAuth, AdminController.updateUserExpiryHandler);
router.post("/registered-users/expiry", requireAdminAuth, AdminController.updateUserExpiryHandler);
router.put("/registered-users/expiry", requireAdminAuth, AdminController.updateUserExpiryHandler);
router.post("/payments", requireAdminAuth, AdminController.addPaymentLogHandler);
router.get("/payments", requireAdminAuth, AdminController.getPaymentsListHandler);

export default router;
