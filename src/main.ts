import { RateLimiterFlexible, RequestEvent, nhttp, serveStatic } from "./deps.ts";
import templating, { TemplateResponder } from "./render.ts";
import { die, randomChoice } from "./utils.ts";
import captchas from "../captchas.json" assert { type: "json" };
import { addMessage, getMessages } from "./db.ts";
import { parse } from "./parseMd.ts";

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

app.post('/', async ({ respondWithTpl, response, cookies, info, request }) => {
    const params = new URLSearchParams(await request.text());

    const captcha = params.get('captcha')?.toLowerCase().trim() || "";
    const name = params.get('name')?.trim() || "";
    const message = params.get('message')?.trim() || "";

    if (!captcha || captcha !== captchas[parseInt(cookies.id)].answer) return error(respondWithTpl)('Invalid or expired captcha.');
    if (!message) return error(respondWithTpl)('You need to supply a message!');
    if (message.length > 300) return error(respondWithTpl)("Your message was too long.");
    if (name.length > 100) return error(respondWithTpl)("Name too long.");

    try {
        await limiter.consume((info.conn.remoteAddr as Deno.NetAddr).hostname, 1);
    }
    catch (e: any) {
        console.log(e);
        return error(respondWithTpl)(`You can only submit one message every five minutes! You can send another message in ${formatMs(e.msBeforeNext)}`)
    }

    addMessage(parse(decodeURIComponent(message)), decodeURIComponent(name || ""));
    response.redirect("/");
});

await app.listen(parseInt(Deno.env.get("PORT") || "8000"), (err, info) => {
    if (err) {
        die(1, `Error: ${err.message}`);
    }

    console.info(`Running on port ${info.port}`);
});