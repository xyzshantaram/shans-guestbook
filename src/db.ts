import { Database } from "./deps.ts";

const INIT_STATEMENTS = [
    "pragma journal_mode = WAL",
    "pragma synchronous = normal",
    "pragma temp_store = memory",
    await Deno.readTextFile('./messages-migration.sql'),
]

const db = new Database('./guestbook.db');
INIT_STATEMENTS.forEach(stmt => db.exec(stmt));

const getMessageQuery = db.prepare("SELECT rowid, name, message, added_on FROM messages LIMIT :limit OFFSET :offset");

export const getMessages = (page?: number) => {
    const limit = 50;
    let offset = 0;

    if (page) offset = limit * page;
    const result = getMessageQuery.all({ limit, offset });

    return {
        hasPrev: offset !== 0,
        hasNext: result.length == limit,
        result,
        currentPage: page || 0,
        nextPage: (page || 0) + 1,
        prevPage: (page || 1) - 1
    };
}

const anonMessageQuery = db.prepare("INSERT INTO messages (message) values (:message)");
const namedMessageQuery = db.prepare("INSERT INTO messages (name, message) values (:name, :message)");
export const addMessage = (message: string, name?: string) => {
    console.log(`Inserting message ${JSON.stringify({ message, name })}. Trimmed name: \`${name?.trim()}\``);
    const query = name?.trim() ? namedMessageQuery : anonMessageQuery;
    console.log(`Selected query ${query}`);
    query.run({ name, message });
}