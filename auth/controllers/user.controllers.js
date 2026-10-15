

import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

import {  verifyToken } from "../lib/jwt.js"; 
import { issueTokens, refreshExists, revokeRefresh, revokeAllRefresh } from "../lib/refreshStore.js";

//signup controller
export const signup = async (req, res) => {
    try {
        const { name, phone, password } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required",
            });
        }

        // Check phone number length and digits
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Phone must be exactly 10 digits",
            });
        }


        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }


        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

   

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Phone is already registered",
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                password: passwordHash,
            },
            select: {         // took this value to return from user 
                id: true,
                name: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Signup successful",
            user,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Phone is already registered",
            });
        }

        // console.error("Signup error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


//login controller
export const login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone is required",
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Phone must be exactly 10 digits",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

            const user = await prisma.user.findUnique({ where: { phone } });

            if (!user) {
                return res.status(401).json({ success: false, message: "Invalid phone or password" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: "Invalid phone or password" });
            }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated",
            });
        }

        const { accessToken, refreshToken } = await issueTokens(user);



        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken , // sending beacuse we didnt use cookie we use headers
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.log("error" , error)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



//refresh controller
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "Refresh token is required" });
        }

        let payload;
        try {
            payload = verifyToken(refreshToken);
        } catch {
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        }

        if (payload.type !== "refresh") {
            return res.status(401).json({ success: false, message: "Invalid token type" });
        }

        const { id: userId, jti } = payload;

        // Redis mein nahi mila = already use ho chuka (reuse/chori), saare sessions band
        if (!(await refreshExists(userId, jti))) {
            await revokeAllRefresh(userId);
            return res.status(401).json({ success: false, message: "Token reuse detected, login again" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.isActive) {
            await revokeAllRefresh(userId);
            return res.status(401).json({ success: false, message: "User not found or deactivated" });
        }

        // rotation: purana delete, naya issue
        await revokeRefresh(userId, jti);
        const tokens = await issueTokens(user);

        return res.status(200).json({ success: true, ...tokens });
    } catch (error) {
        console.error("REFRESH ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//logout controller
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            try {
                const payload = verifyToken(refreshToken);
                if (payload.type === "refresh") {
                    await revokeRefresh(payload.id, payload.jti);
                }
            } catch {
                // token already invalid, koi dikkat nahi
            }
        }

        return res.status(200).json({ success: true, message: "Logged out" });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//logout from all devices (authenticate middleware ke saath lagana)
export const logoutAll = async (req, res) => {
    try {
        await revokeAllRefresh(req.user.id);
        return res.status(200).json({ success: true, message: "Logged out from all devices" });
    } catch (error) {
        console.error("LOGOUT ALL ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};