import { verifyToken } from "../lib/jwt.js";

export const authenticate = (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const payload = verifyToken(header.split(" ")[1]);

        if (payload.type !== "access") {
            return res.status(401).json({ success: false, message: "Invalid token type" });
        }

        req.user = { id: payload.id, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Forbidden",
        });
    }
    next();
};