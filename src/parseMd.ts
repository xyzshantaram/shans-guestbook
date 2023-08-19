import { marked } from "https://esm.sh/marked@5.0.4";

const renderer = {
    image: () => '',
    html: () => '',
    table: () => '',
    checkbox: () => '',
    link: (_href: string, _title: string, text: string) => ` <span>${text}</span> `,
    br: () => '',
};

marked.use({ renderer, mangle: false, headerIds: false });

export const parse = (raw: string) => {
    return marked.parseInline(raw);
}