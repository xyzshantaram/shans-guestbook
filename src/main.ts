import { RateLimiterFlexible, TObject, nhttp, serveStatic } from "./deps.ts";
import templating, { TemplateResponder } from "./render.ts";
import { die, randomChoice } from "./utils.ts";
import captchas from "../captchas.json" assert { type: "json" };
import { addMessage, getMessages } from "./db.ts";
import { parse } from "./parseMd.ts";

const limiter = new RateLimiterFlexible.RateLimiterMemory({
    points: 1,
    duration: 3,
});

const app = nhttp()
    .use(templating.middleware)
    .use(serveStatic('./static', { prefix: "/static" }));

const error = (responder: TemplateResponder) => (message: string) => responder('error', { message }, { status: 400 });

const getRequestIp = (req: Request) => {
    return req.headers.get('x-real-ip')!;
}

app.get('/', ({ request, query, respondWithTpl }) => {
    const [id, captcha] = randomChoice(captchas);
    console.log(`Captcha ID for ${getRequestIp(request)} set to ${id}, captcha object:`);
    console.log(captcha);
    const messages = getMessages(query.page);

    respondWithTpl('index', { captcha: captcha.question, messages }, { cookie: { id } });
});

app.post('/', async ({ respondWithTpl, response, cookies, request }) => {
    const params = new URLSearchParams(await request.text());

    const captcha = params.get('captcha')?.toLowerCase().trim() || "";
    const name = params.get('name')?.trim() || "";
    const message = params.get('message')?.trim() || "";

    const question = captchas[parseInt(cookies.id)];
    console.log({
        IP: getRequestIp(request),
        theirAnswer: captcha,
        theAnswer: question?.answer,
        isAnswerCorrect: captcha === question.answer
    });

    if (!question || !captcha || captcha !== question.answer) return error(respondWithTpl)('Invalid or expired captcha.');
    if (!message) return error(respondWithTpl)('You need to supply a message!');
    if (message.length > 300) return error(respondWithTpl)("Your message was too long.");
    if (name.length > 100) return error(respondWithTpl)("Name too long.");

    try {
        await limiter.consume(getRequestIp(request), 1);
    }
    catch (e: any) {
        return error(respondWithTpl)(`You can only submit one message every 3 seconds! Try again later.`);
    }

    const decoded = decodeURIComponent(message);
    addMessage(await parse(decoded) || "", decodeURIComponent(name || ""));
    response.redirect("/");
});

await app.listen(parseInt(Deno.env.get("PORT") || "8000"), (err, info) => {
    if (err) {
        die(1, `Error: ${err.message}`);
    }

    console.info(`Running on port ${info.port}`);
});