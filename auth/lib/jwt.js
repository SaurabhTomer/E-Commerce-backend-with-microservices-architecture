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

export const signAccessToken = (payload) =>
    jwt.sign({ ...payload, type: "access" }, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: "15m",
    });

export const signRefreshToken = (payload, jti) =>
    jwt.sign({ ...payload, type: "refresh" }, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: "7d",
        jwtid: jti,
    });

export const verifyToken = (token) =>
    jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });

export const signToken = signAccessToken; // purane imports na tootein