import { server } from "./index.js";
import { z } from "zod";
import { McpError } from "./errors.js";
import { getMemoryBlob, getMemoryBlobList, createMemoryBlob, createMemoryEntry } from "./store.js";

function logTool(tool: string, msg: string, data?: unknown) {
	const entry = data !== undefined ? `[tool:${tool}] ${msg} ${JSON.stringify(data)}` : `[tool:${tool}] ${msg}`;
	console.log(entry);
}

export function registerTools() {
	server.registerTool(
		"get_memory_blob_list",
		{
			description: "Get a list of all memory blobs (name and description only)",
			inputSchema: {},
		},
		async () => {
			logTool("get_memory_blob_list", "called");
			try {
				const list = getMemoryBlobList();
				return { content: [{ type: "text", text: JSON.stringify(list) }] };
			} catch (e) {
				if (e instanceof McpError) {
					logTool("get_memory_blob_list", `error: ${e.message}`);
					return { content: [{ type: "text", text: e.message }], isError: true };
				}
				throw e;
			}
		},
	);

	server.registerTool(
		"get_memory_blob",
		{
			description: "Get a memory blob and all its entries by name",
			inputSchema: { name: z.string().describe("The name of the memory blob") },
		},
		async ({ name }: { name: string }) => {
			logTool("get_memory_blob", `called`, { name });
			try {
				const blob = getMemoryBlob(name);
				if (!blob) {
					logTool("get_memory_blob", `blob "${name}" not found`);
					return { content: [{ type: "text", text: `No memory blob found with name "${name}"` }] };
				}
				return { content: [{ type: "text", text: JSON.stringify(blob) }] };
			} catch (e) {
				if (e instanceof McpError) {
					logTool("get_memory_blob", `error: ${e.message}`);
					return { content: [{ type: "text", text: e.message }], isError: true };
				}
				throw e;
			}
		},
	);

	server.registerTool(
		"create_memory_blob",
		{
			description: "Create a new memory blob",
			inputSchema: {
				name: z.string().describe("The unique name for the memory blob"),
				description: z.string().describe("A description of what this blob stores"),
			},
		},
		async ({ name, description }: { name: string; description: string }) => {
			logTool("create_memory_blob", `called`, { name, description });
			try {
				createMemoryBlob(name, description);
				logTool("create_memory_blob", `success: blob "${name}" created`);
				return { content: [{ type: "text", text: `Memory blob "${name}" created.` }] };
			} catch (e) {
				if (e instanceof McpError) {
					logTool("create_memory_blob", `error: ${e.message}`);
					return { content: [{ type: "text", text: e.message }], isError: true };
				}
				throw e;
			}
		},
	);

	server.registerTool(
		"create_memory_entry",
		{
			description: "Add a new entry to an existing memory blob",
			inputSchema: {
				blobName: z.string().describe("The name of the memory blob to add the entry to"),
				entryText: z.string().describe("The text content of the memory entry"),
			},
		},
		async ({ blobName, entryText }: { blobName: string; entryText: string }) => {
			logTool("create_memory_entry", `called`, { blobName, entryText });
			try {
				createMemoryEntry(blobName, entryText);
				logTool("create_memory_entry", `success: entry added to "${blobName}"`);
				return { content: [{ type: "text", text: `Entry added to blob "${blobName}".` }] };
			} catch (e) {
				if (e instanceof McpError) {
					logTool("create_memory_entry", `error: ${e.message}`);
					return { content: [{ type: "text", text: e.message }], isError: true };
				}
				throw e;
			}
		},
	);
}
