import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";

const server = new McpServer({
	name: "extended-memory-mcp",
	version: "1.0.0",
});

server.registerTool(
	"get_archives",
	{
		description: "Get a list of memory archives",
		inputSchema: {},
	},
	async () => {
		return { content: [{ type: "text", text: "hello world" }] };
	},
);

const app = createMcpExpressApp();

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
