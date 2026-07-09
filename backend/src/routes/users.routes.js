import {Router} from "express";
import { login_user, register_user } from "../controllers/user_controller.js";

const router = Router();

router.route("/login").post(login_user);
router.route("/register").post(register_user);
router.route("/add_to_activity");
router.route("/get_all_activity");

export default router;