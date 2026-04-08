import { importPKCS8, importSPKI, exportJWK } from "jose";
import { env } from "./env.js";

let _privateKey: CryptoKey | null = null;
let _publicKey: CryptoKey | null = null;

export async function getPrivateKey(): Promise<CryptoKey> {
  if (!_privateKey) {
    _privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, "RS256");
  }
  return _privateKey;
}

export async function getPublicKey(): Promise<CryptoKey> {
  if (!_publicKey) {
    _publicKey = await importSPKI(env.JWT_PUBLIC_KEY, "RS256");
  }
  return _publicKey;
}

export async function getPublicJWK() {
  const publicKey = await getPublicKey();
  const jwk = await exportJWK(publicKey);
  return { ...jwk, alg: "RS256", use: "sig", kid: "auth-service-1" };
}
