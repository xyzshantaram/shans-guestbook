import { SqliteStore } from "./SqliteStore.ts";

export class ClientSession {
    private sid: string;
    private store: SqliteStore;

    constructor(sid: string, store: SqliteStore) {
        this.sid = sid;
        this.store = store;
    }

    get<T>(key: string) {
        return this.store.get<T>(this.sid, key);
    }

    set(key: string, val: any) {
        this.store.set(this.sid, key, val);
    }

    delete(key: string) {
        this.store.delete(this.sid, key);
    }

    clear() {
        this.store.clear(this.sid);
    }
}