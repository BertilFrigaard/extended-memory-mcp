import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { Request, Response } from "express";
import { registerTools } from "./tools.js";
import { oauthProvider } from "./oauth/provider.js";

export const server = new McpServer({
	name: "extended-memory-mcp",
	description:
		"This is your memory. A little about the architecture of your memory: \
		 You have access to a list of memory blobs. A memory blob is a container \
	     that contains related memory entries. A memory entry is the actual \
	     memory text. When a user asks anything you should always lookup relevant \
		 memory blobs, which can act as relevant context in your conversation.",
	version: "1.0.0",
});

// Tools should be registered after server is created
registerTools();

const ALLOWED_HOSTS = process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(",") : undefined;

const app = createMcpExpressApp({
	host: "0.0.0.0",
	...(ALLOWED_HOSTS ? { allowedHosts: ALLOWED_HOSTS } : {}),
});

const PUBLIC_URL = process.env.PUBLIC_URL;
if (!PUBLIC_URL) {
	console.error("FATAL: PUBLIC_URL environment variable must be set (e.g. https://mcp.example.com).");
	process.exit(1);
}

// Mount OAuth endpoints (/.well-known/..., /authorize, /token, /register)
app.use(mcpAuthRouter({
	provider: oauthProvider,
	issuerUrl: new URL(PUBLIC_URL),
	resourceServerUrl: new URL(PUBLIC_URL),
}));

// Guard /mcp with bearer token validation
app.use("/mcp", requireBearerAuth({ verifier: oauthProvider }));

app.post("/mcp", async (req: Request, res: Response) => {
	try {
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});
		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
		res.on("close", () => {
			transport.close();
		});
	} catch (error) {
		console.error("Error handling MCP request:", error);
		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: "2.0",
				error: { code: -32603, message: "Internal server error" },
				id: null,
			});
		}
	}
});

app.get("/mcp", (_req: Request, res: Response) => {
	res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});

app.delete("/mcp", (_req: Request, res: Response) => {
	res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.listen(PORT, () => {
	console.log(`Extended Memory MCP Server running on port ${PORT}`);
});

process.on("SIGINT", () => {
	console.log("Shutting down...");
	process.exit(0);
});
