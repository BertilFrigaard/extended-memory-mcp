import { server } from "./index.js";
import { z } from "zod";
import { McpError } from "./errors.js";
const store = require("./store.js");

server.registerTool(
	"get_memory_blob_list",
	{
		description: "Get a list of all memory blobs (name and description only)",
		inputSchema: {},
	},
	async () => {
		try {
			const list = store.getMemoryBlobList();
			return { content: [{ type: "text", text: JSON.stringify(list) }] };
		} catch (e) {
			if (e instanceof McpError) {
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
		try {
			const blob = store.getMemoryBlob(name);
			if (!blob) {
				return { content: [{ type: "text", text: `No memory blob found with name "${name}"` }] };
			}
			return { content: [{ type: "text", text: JSON.stringify(blob) }] };
		} catch (e) {
			if (e instanceof McpError) {
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
		try {
			store.createMemoryBlob(name, description);
			return { content: [{ type: "text", text: `Memory blob "${name}" created.` }] };
		} catch (e) {
			if (e instanceof McpError) {
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
		try {
			store.createMemoryEntry(blobName, entryText);
			return { content: [{ type: "text", text: `Entry added to blob "${blobName}".` }] };
		} catch (e) {
			if (e instanceof McpError) {
				return { content: [{ type: "text", text: e.message }], isError: true };
			}
			throw e;
		}
	},
);
