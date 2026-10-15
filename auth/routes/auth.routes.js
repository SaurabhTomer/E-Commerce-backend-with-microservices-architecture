
import { Router } from "express";
import { login, logout, logoutAll, refresh, signup } from "../controllers/user.controllers.js";
import { authenticate } from "../middlewares/auth.js";


const authRouter = Router();

// Signup route
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/logout-all",authenticate ,  logoutAll);

export default authRouter;
