import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me",
);

const ISSUER = "urn:portfolio:admin";
const AUDIENCE = "urn:portfolio:admin";

export interface AdminPayload extends JWTPayload {
  email: string;
}

/**
 * Sign a JWT for the given admin email.
 * Works in both Node.js and Edge runtimes.
 */
export async function signToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT and return its payload.
 * Returns `null` when the token is invalid or expired.
 * Works in both Node.js and Edge runtimes.
 */
export async function verifyToken(
  token: string,
): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as AdminPayload;
  } catch {
    return null;
  }
}
