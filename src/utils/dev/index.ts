export const dev = {
    isDev: import.meta.env.MODE === 'development',

    run: (fn: () => void) => {
        if (dev.isDev) fn();
    }
}
