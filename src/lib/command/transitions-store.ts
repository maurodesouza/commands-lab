type Transition = {
    abort: () => void;
}

export type TransitionKey = unknown | unknown[]

export type TransitionConfig = {
    transition: TransitionKey;
}   

export class TransitionStore {
    private static instance: TransitionStore;
    transitions: Map<string, Transition> = new Map();


    private constructor() {}

    start(key: TransitionKey) {
        const serializedKey = TransitionStore.serializeKey(key);

        if (this.transitions.has(serializedKey)) {
            this.abort(key);
        }

        const controller = new AbortController();

        this.transitions.set(serializedKey, {
            abort: () => controller.abort()
        });

        return {
            signal: controller.signal,
        }
    }

    abort(key: TransitionKey) {
        const serializedKey = TransitionStore.serializeKey(key);
        const transition = this.transitions.get(serializedKey);

        if (transition) transition.abort();
    }

    done(key: TransitionKey) {
        const serializedKey = TransitionStore.serializeKey(key);
        this.transitions.delete(serializedKey);
    }

    static serializeKey(key: TransitionKey) {
        return JSON.stringify(key);
    }

    static getInstance() {
        if (!TransitionStore.instance) {
            TransitionStore.instance = new TransitionStore();
        }

        return TransitionStore.instance;
    }
}
