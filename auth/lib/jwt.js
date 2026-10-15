import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// production mein env se lo (newline escape ke saath), local mein file se
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY
    ? process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n")
    : fs.readFileSync(path.resolve("keys/private.pem"), "utf8");

const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY
    ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n")
    : fs.readFileSync(path.resolve("keys/public.pem"), "utf8");

export const signToken = (payload) =>
    jwt.sign(payload, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: "7d",
    });

export const verifyToken = (token) =>
    jwt.verify(token, PUBLIC_KEY, {
        algorithms: ["RS256"], // zaroori: algorithm confusion attack se bachata hai
    });