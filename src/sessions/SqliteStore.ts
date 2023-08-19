import { Database } from "../deps.ts";

export class SqliteStore {
    db: Database;

    constructor() {
        this.db = new Database('./sessions.db');
        this.db.exec('CREATE TABLE IF NOT EXISTS sessions(id TEXT UNIQUE NOT NULL, data TEXT not null);');
        this.db.exec("pragma journal_mode = WAL");
        this.db.exec("pragma synchronous = normal");
        this.db.exec("pragma temp_store = memory");
    }

    createSession() {
        const id = crypto.randomUUID();
        this.db.exec('insert into sessions(id, data) VALUES(?, ?);', id, '{}');
        return id;
    }

    getSession(sid: string): Record<string, any> {
        const rows = this.db.prepare('SELECT data FROM sessions WHERE id = ?').all(sid);
        if (rows.length != 0) {
            return JSON.parse(rows[0].data as string || '{}');
        }
        this.db.exec('INSERT INTO sessions(id, data) VALUES(?, ?);', sid, '{}');
        return {};
    }

    persist(sid: string, data: Record<string, any>) {
        this.db.exec('UPDATE sessions SET data = ? WHERE id = ?;', JSON.stringify(data), sid);
    }

    get<T>(sid: string, key: string): T | null {
        const session = this.getSession(sid);
        const val: T | null = session[key] || null;
        return val;
    }

    set(sid: string, key: string, val: any) {
        const session = this.getSession(sid);
        session[key] = val;
        this.persist(sid, session);
    }

    delete(sid: string, key: string) {
        const session = this.getSession(sid);
        delete session[key];
        this.persist(sid, session);
    }

    clear(sid: string) {
        this.db.exec('UPDATE sessions SET data = ? where id = ?', '{}', sid);
    }
}