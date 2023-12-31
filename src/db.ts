import { DB } from "./deps.ts";

const INIT_STATEMENTS = [
    await Deno.readTextFile('./messages-migration.sql'),
]
console.log(INIT_STATEMENTS);
const db = new DB('./guestbook.db');
INIT_STATEMENTS.forEach(stmt => db.execute(stmt));

const getMessageQuery = db.prepareQuery("SELECT rowid, name, message, color, added_on FROM messages ORDER BY rowid desc LIMIT :limit OFFSET :offset");

export const getMessages = (page?: number) => {
    const limit = 50;
    let offset = 0;

    if (page) offset = limit * page;
    const result = getMessageQuery.allEntries({ limit, offset });

    console.log(result);

    return {
        hasPrev: offset !== 0,
        hasNext: result.length == limit,
        result,
        currentPage: page || 0,
        nextPage: (page || 0) + 1,
        prevPage: (page || 1) - 1
    };
}

const anonMessageQuery = db.prepareQuery("INSERT INTO messages (message, color) values (:message, :color)");
const namedMessageQuery = db.prepareQuery("INSERT INTO messages (name, message, color) values (:name, :message, :color)");
export const addMessage = (message: string, color: string, name?: string) => {
    console.log(`Inserting message ${JSON.stringify({ color, message, name })}.`);
    const params: { name?: string, message: string, color: string } = { message, color };

    const trimmedName = name?.trim() || "";
    if (trimmedName) {
        params.name = trimmedName;
        namedMessageQuery.execute(params);
    }
    else {
        anonMessageQuery.execute(params);
    }
}