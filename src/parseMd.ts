import { RendererObject, marked } from "https://esm.sh/marked@7.0.3";

const renderer: RendererObject = {
    image: () => '',
    html: () => '',
    table: () => '',
    checkbox: () => '',
    link: (_href: string | null | undefined, _title: string | null | undefined, text: string) => ` <span>${text}</span> `,
    br: () => '',
};

marked.use({ renderer, mangle: false, headerIds: false });

export const parse = (raw: string) => {
    return marked.parseInline(raw) || "";
}