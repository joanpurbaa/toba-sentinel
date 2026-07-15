import { SignJWT, jwtVerify } from "jose";

function getSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error("JWT_SECRET is not defined");
	}

	return new TextEncoder().encode(secret);
}

export async function signToken(payload: Record<string, unknown>) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(getSecret());
}

export async function verifyToken(token: string) {
	const { payload } = await jwtVerify(token, getSecret());
	return payload;
}
