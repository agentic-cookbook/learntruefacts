import { SignJWT, jwtVerify } from "jose";
import { getPrivateKey, getPublicKey } from "../config/keys.js";

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  const privateKey = await getPrivateKey();
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "RS256", kid: "auth-service-1" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("4h")
    .setIssuer("learn-true-facts-auth")
    .sign(privateKey);
}

export async function signRefreshToken(userId: string): Promise<string> {
  const privateKey = await getPrivateKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "auth-service-1" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .setIssuer("learn-true-facts-auth")
    .sign(privateKey);
}

export async function verifyToken(token: string) {
  const publicKey = await getPublicKey();
  return jwtVerify(token, publicKey, { issuer: "learn-true-facts-auth" });
}
