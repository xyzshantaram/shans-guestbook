import { marked } from "https://esm.sh/marked@5.0.4";

const renderer = {
    image: () => '',
    html: () => '',
    table: () => '',
    checkbox: () => '',
    link: () => '',
    br: () => '',
};

marked.use({ renderer, mangle: false, headerIds: false });

export const parse = (raw: string) => {
    return marked.parse(raw);
}