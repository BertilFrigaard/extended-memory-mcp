import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import crypto from "node:crypto";

const dynamicClients = new Map<string, OAuthClientInformationFull>();

export const clientsStore: OAuthRegisteredClientsStore = {
	getClient(clientId: string) {
		return dynamicClients.get(clientId);
	},
	registerClient(client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">) {
		const full: OAuthClientInformationFull = {
			...client,
			client_id: crypto.randomUUID(),
			client_id_issued_at: Math.floor(Date.now() / 1000),
		};
		dynamicClients.set(full.client_id, full);
		return full;
	},
};
