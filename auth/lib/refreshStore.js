import crypto from "crypto";
import { redis } from "./redis.js";
import { signAccessToken, signRefreshToken } from "./jwt.js";

const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;


// create token at the time of login or refresh
export const issueTokens = async (user) => {
    const jti = crypto.randomUUID();
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id }, jti);
    await redis.set(`refresh:${user.id}:${jti}`, "1", "EX", REFRESH_TTL_SEC);
    return { accessToken, refreshToken };
};

// check is refersh token valid or not
export const refreshExists = async (userId, jti) =>
    (await redis.exists(`refresh:${userId}:${jti}`)) === 1;


//   Ek refresh token ko kill karta hai (logout ya rotation ke time)
export const revokeRefresh = (userId, jti) =>
    redis.del(`refresh:${userId}:${jti}`);


// User ke saare refresh tokens kill karta hai (saare devices se logout)
export const revokeAllRefresh = async (userId) => {
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(keys);      // Agar koi key mili to sab ek saath delete karo
};