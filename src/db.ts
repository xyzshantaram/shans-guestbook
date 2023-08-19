import { Database } from "./deps.ts";

const INIT_STATEMENTS = [
    "pragma journal_mode = WAL",
    "pragma synchronous = normal",
    "pragma temp_store = memory",
    await Deno.readTextFile('./messages-migration.sql'),
]

export const db = new Database('./guestbook.db');
INIT_STATEMENTS.forEach(stmt => db.exec(stmt));