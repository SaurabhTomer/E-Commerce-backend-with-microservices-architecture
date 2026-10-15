

import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { signToken } from "../lib/jwt.js";

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

        const passwordHash = await bcrypt.hash(password, 12);

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

        const token = signToken({ id: user.id, role: user.role });


        return res.status(200).json({
            success: true,
            message: "Login successful",
            token, // sending beacuse we didnt use cookie we use headers
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

