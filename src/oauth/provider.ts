import type { OAuthServerProvider, AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { OAuthClientInformationFull, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { clientsStore } from "./store.js";
import { createSecretKey, randomBytes } from "node:crypto";

const JWT_SECRET_HEX = process.env.JWT_SECRET;
if (!JWT_SECRET_HEX) {
	console.error("FATAL: JWT_SECRET environment variable must be set (32-byte hex string).");
	console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
	process.exit(1);
}
const JWT_SECRET_KEY = Buffer.from(JWT_SECRET_HEX, "hex");

const ISSUER = process.env.PUBLIC_URL;
if (!ISSUER) {
	console.error("FATAL: PUBLIC_URL environment variable must be set (e.g. https://mcp.example.com).");
	process.exit(1);
}

const TOKEN_TTL = 3600; // 1 hour in seconds

// Pending authorization codes: code -> { codeChallenge, clientId, expiresAt }
const pendingCodes = new Map<string, { codeChallenge: string; clientId: string; expiresAt: number }>();

function getSecretKey(): CryptoKey {
	return createSecretKey(JWT_SECRET_KEY) as unknown as CryptoKey;
}

export const oauthProvider: OAuthServerProvider = {
	get clientsStore() {
		return clientsStore;
	},

	async authorize(_client: OAuthClientInformationFull, params: AuthorizationParams, res: Response) {
		const code = randomBytes(20).toString("hex");
		pendingCodes.set(code, {
			codeChallenge: params.codeChallenge,
			clientId: _client.client_id,
			expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
		});
		// Auto-approve: redirect immediately with the auth code
		const redirect = new URL(params.redirectUri);
		redirect.searchParams.set("code", code);
		if (params.state) redirect.searchParams.set("state", params.state);
		res.redirect(redirect.toString());
	},

	async challengeForAuthorizationCode(_client: OAuthClientInformationFull, code: string): Promise<string> {
		const entry = pendingCodes.get(code);
		if (!entry || entry.expiresAt < Date.now()) {
			throw new Error("Invalid or expired authorization code");
		}
		return entry.codeChallenge;
	},

	async exchangeAuthorizationCode(client: OAuthClientInformationFull, code: string): Promise<OAuthTokens> {
		const entry = pendingCodes.get(code);
		if (!entry || entry.expiresAt < Date.now()) {
			throw new Error("Invalid or expired authorization code");
		}
		pendingCodes.delete(code);

		const secretKey = await getSecretKey();
		const accessToken = await new SignJWT({ clientId: client.client_id, scopes: [] })
			.setProtectedHeader({ alg: "HS256" })
			.setIssuer(ISSUER!)
			.setIssuedAt()
			.setExpirationTime(`${TOKEN_TTL}s`)
			.sign(secretKey);

		return { access_token: accessToken, token_type: "bearer", expires_in: TOKEN_TTL };
	},

	async exchangeRefreshToken(): Promise<OAuthTokens> {
		throw new Error("Refresh tokens not supported");
	},

	async verifyAccessToken(token: string): Promise<AuthInfo> {
		const secretKey = await getSecretKey();
		const { payload } = await jwtVerify(token, secretKey, { issuer: ISSUER! });
		return {
			token,
			clientId: payload["clientId"] as string,
			scopes: (payload["scopes"] as string[]) ?? [],
			expiresAt: payload.exp!,
		};
	},
};
