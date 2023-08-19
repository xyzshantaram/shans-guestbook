export const die = (code: number, ...args: any[]) => {
    (code === 0 ? console.log : console.error)(...args);
    Deno.exit(code);
}

export const randomChoice = <T>(arr: Array<T>): [number, T] => {
    const idx = Math.floor(Math.random() * arr.length);
    return [idx, arr[idx]];
}

export const fmtDate = (str: string) => {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const date = new Date(str);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `at ${hours}:${minutes} on ${month} ${day}, ${year}`;
};