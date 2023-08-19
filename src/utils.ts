export const die = (code: number, ...args: any[]) => {
    (code === 0 ? console.log : console.error)(...args);
    Deno.exit(code);
}

export const randomChoice = <T>(arr: Array<T>): [number, T] => {
    const idx = Math.floor(Math.random() * arr.length);
    return [idx, arr[idx]];
}