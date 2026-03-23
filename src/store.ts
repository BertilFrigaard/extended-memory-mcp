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

export function getMemoryBlobList() {
	return memoryStore.memory.map((v) => {
		{
			(v.name, v.description);
		}
	});
}

export function getMemoryBlob(name: string) {
	return memoryStore.memory.find((v) => v.name === name);
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
}

export function createMemoryEntry(blobName: string, entryText: string) {
	const blob = getMemoryBlob(blobName);
	if (!blob) {
		throw new McpError(`No memory blob exists with the name \"${blobName}\"`);
	}
	blob.content.push({ id: blob.content.length, text: entryText });
}
