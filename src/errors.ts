export class McpError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "McpError";
	}
}
