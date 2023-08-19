// deno-lint-ignore-file no-explicit-any
import { RateLimiterFlexible, RequestEvent, nhttp, serveStatic } from "./deps.ts";
import templating, { TemplateResponder } from "./render.ts";
import { die, randomChoice } from "./utils.ts";
import captchas from "../captchas.json" assert { type: "json" };
import { addMessage, getMessages } from "./db.ts";

const limiter = new RateLimiterFlexible.RateLimiterMemory({
    points: 1,
    duration: 300,
});

const app = nhttp()
    .use(templating.middleware)
    .use(serveStatic('./static', { prefix: "/static" }));

const error = (responder: TemplateResponder) => (message: string) => responder('error', { message }, { status: 400 });

const formatMs = (ms: number) => {
    const inSeconds = Math.floor(ms / 1000);
    return `${Math.floor(inSeconds / 60)} minutes and ${inSeconds % 60} seconds.`;
}

app.get('/', ({ query, respondWithTpl }) => {
    const [id, captcha] = randomChoice(captchas);
    const messages = getMessages(query.page);

    respondWithTpl('index', { captcha: captcha.question, messages }, { cookie: { id } });
});

app.post('/', (rev: RequestEvent<Deno.Conn>, next) => {
    limiter.consume(rev.info.conn.remoteAddr.toString(), 1).then(value => {
        return next();
    }).catch(res => {
        return error(rev.respondWithTpl)(`You can only submit one message every five minutes! You can send another message in ${formatMs(res.msBeforeNext)}`)
    })
}, ({ body, respondWithTpl, response }) => {
    if (!body.captcha) return error(respondWithTpl)('Missing or expired captcha.');
    if (!body.message || !body.message.trim()) return error(respondWithTpl)('You need to supply a message!');
    if (body.message.length > 140) return error(respondWithTpl)("Your message was too long.");

    addMessage(body.message, body.name);
    response.redirect("/");
});

await app.listen(8000, (err, info) => {
    if (err) {
        die(1, `Error: ${err.message}`);
    }

    console.info(`Running on port ${info.port}`);
});