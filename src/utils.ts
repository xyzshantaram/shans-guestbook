import captchas from "../captchas.json" assert { type: "json"};

export const die = (code: number, ...args: any[]) => {
    (code === 0 ? console.log : console.error)(...args);
    Deno.exit(code);
}

export const deslug = (slug: string) => {
    if (!slug) return '';
    const SINGLE_LETTER_RE = /-(\w)-/;
    while (SINGLE_LETTER_RE.test(slug)) slug = slug.replace(SINGLE_LETTER_RE, '\'$1-');
    const words = slug.split('-'); // Split the slug into an array of words
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    const sentence = words.join(" "); // Join the words back into a sentence
    return sentence;
}

export const slug = (str: string) => {
    str = str.toLowerCase(); // Convert string to lowercase
    str = str.replace(/[^a-z0-9]+/g, "-"); // Replace non-alphanumeric characters with hyphens
    str = str.replace(/^-|-$/g, ""); // Remove leading and trailing hyphens
    str = str.replace(/^[0-9]+/, ""); // Remove leading numbers
    return str;
}

export const randomChoice = <T>(arr: Array<T>): T => {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const getCaptcha = () => {
    return randomChoice(captchas);
}