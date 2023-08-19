import { Merge, RequestEvent, TObject, NextFunction, HttpResponse } from "../deps.ts";
import { SqliteStore } from "./SqliteStore.ts";
import { ClientSession } from "./ClientSession.ts";

const store = new SqliteStore();
const cookieOpts = {};

export const middleware = (rev: Merge<RequestEvent<TObject>, unknown>, next: NextFunction) => {
    let { sid } = rev.cookies;
    if (!sid) {
        sid = store.createSession();
        rev.response.cookie('sid', sid, {
            expires: new Date(Date.now() + 7 * 864e5),
            httpOnly: true,
            sameSite: "Lax",
            ...cookieOpts
        });
    }

    rev.session = new ClientSession(sid, store);
    return next();
}

export const destroySession = (sid: string, res: HttpResponse) => {
    store.clear(sid);
    res.clearCookie('sid');
}

export default { middleware, destroySession };