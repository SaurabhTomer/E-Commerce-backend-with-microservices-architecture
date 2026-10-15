
import { Router } from "express";
import { login, signup } from "../controllers/user.controllers.js";
import { authenticate } from "../middlewares/auth.js";

const authRouter = Router();

// Signup route
authRouter.post("/signup", signup);
authRouter.post("/login", authenticate, login);

export default authRouter;
