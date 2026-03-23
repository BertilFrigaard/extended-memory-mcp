import { McpError } from "./errors.js";

interface MemoryEntry {
	id: number;
	text: string;
}

interface MemoryBlob {
	name: string;
	description: string;
	content: MemoryEntry[];
}

interface MemoryStore {
	memory: MemoryBlob[];
	archive: MemoryBlob[];
}

const memoryStore: MemoryStore = {
	memory: [],
	archive: [],
};

function log(fn: string, msg: string, data?: unknown) {
	const entry = data !== undefined ? `[store:${fn}] ${msg} ${JSON.stringify(data)}` : `[store:${fn}] ${msg}`;
	console.log(entry);
}

export function getMemoryBlobList() {
	const list = memoryStore.memory.map((v) => ({ name: v.name, description: v.description }));
	log("getMemoryBlobList", `returning ${list.length} blob(s)`, list);
	return list;
}

export function getMemoryBlob(name: string) {
	const blob = memoryStore.memory.find((v) => v.name === name);
	if (blob) {
		log("getMemoryBlob", `found blob "${name}" with ${blob.content.length} entries`);
	} else {
		log("getMemoryBlob", `blob "${name}" not found`);
	}
	return blob;
}

export function createMemoryBlob(name: string, description: string) {
	if (getMemoryBlob(name)) {
		throw new McpError(`Can not create a memory blob with the name \"${name}\" since a blob already exists with that name.`);
	}
	memoryStore.memory.push({
		name: name,
		description: description,
		content: [],
	});
	log("createMemoryBlob", `created blob "${name}"`, { description });
}

export function createMemoryEntry(blobName: string, entryText: string) {
	const blob = getMemoryBlob(blobName);
	if (!blob) {
		throw new McpError(`No memory blob exists with the name \"${blobName}\"`);
	}
	const id = blob.content.length;
	blob.content.push({ id, text: entryText });
	log("createMemoryEntry", `added entry id=${id} to blob "${blobName}"`, { entryText });
}
