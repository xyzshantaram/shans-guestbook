import { Liquid, Merge, NextFunction, RequestEvent, TObject, Template, fs } from "./deps.ts";
import { die, fmtDate } from "./utils.ts";

class TemplateRenderer {
    #engine: Liquid;
    #templates: Record<string, Template[]> = {};
    #src: Record<string, string> = {};
    viewPath: string | URL;
    #inited = false;

    constructor(viewPath: string | URL) {
        this.viewPath = viewPath;
        this.#engine = new Liquid({
            relativeReference: false,
            jsTruthy: true,
            fs: {
                exists: (filePath) => {
                    return Promise.resolve(Object.keys(this.#src).includes(filePath));
                },
                resolve: (_, file, __) => {
                    return file;
                },
                existsSync: (filePath) => {
                    return Object.keys(this.#src).includes(filePath);
                },
                readFile: (path) => {
                    return Promise.resolve(this.#src[path]);
                },
                readFileSync: (path) => {
                    return this.#src[path];
                }
            }
        });

        this.init().then(_ => {
            console.log('Parsed templates successfully.');
        }).catch(e => {
            die(1, "Error initialising templates: ", e);
        });
    }

    async init() {
        this.#inited = true;
        this.#engine.registerFilter('format_date', fmtDate);
        return await Deno.stat(this.viewPath).then(val => {
            if (!val.isDirectory) throw new Error('View path is not directory');
            for (const file of fs.walkSync(this.viewPath)) {
                try {
                    if (file.isFile && file.name.endsWith('.liquid')) {
                        const contents = Deno.readTextFileSync(file.path);

                        this.#src[file.name] = contents;
                        this.#templates[file.name] = this.#engine.parse(contents);
                    }
                }
                catch (e) {
                    console.log('ERROR', e);
                }
            }
        })
    }

    render(name: string, args?: Record<string, any>) {
        if (!this.#inited) die(1, 'ERROR: attempt to render template before TemplateRenderer.init() called');
        return this.#engine.render(this.#templates[name + '.liquid'], args);
    }
}

const templates = new TemplateRenderer('./templates');
export const render = (tpl: string, ctx: Record<string, any>) => {
    return templates.render(tpl, ctx);
}

export const tplMiddleware = (rev: Merge<RequestEvent<TObject>, unknown>, next: NextFunction) => {
    rev.respondWithTpl = async (tpl: string, ctx: Record<string, any>, options?: Record<string, any>) => {
        if (options?.status) {
            rev.response.statusCode = options?.status;
        }

        if (options?.cookie) {
            for (const [key, val] of Object.entries(options.cookie)) {
                rev.response.cookie(key, val as string, { httpOnly: true });
            }
        }

        ctx = {
            loggedIn: rev.loggedIn,
            ...ctx
        };
        rev.response.type('text/html').send(await render(tpl, ctx));
    }

    return next();
}
export type TemplateResponder = (tpl: string, ctx: Record<string, any>, options?: Record<string, any>) => Promise<void>;
export default { middleware: tplMiddleware, render };