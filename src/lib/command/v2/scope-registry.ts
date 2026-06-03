import { Subject } from "./subject";

type Instance = {
	id: string;
	label?: string;
};

export class ScopeRegistry extends Subject {
	private static instance: ScopeRegistry;
	private domains: Map<string, Map<string, Instance>> = new Map();
	private caches: Map<string, Instance[]> = new Map();

	private constructor() {
		super();
	}

	add(domain: string, instance: Instance) {
		if (!this.domains.has(domain)) {
			this.domains.set(domain, new Map());
		}

		this.domains.get(domain)?.set(instance.id, instance);
		this.caches.delete(domain);
		this.notify();
	}

	getInstances(domain: string): Instance[] {
		const cached = this.caches.get(domain);
		if (cached) return cached;

		const fresh = Array.from(this.domains.get(domain)?.values() ?? []);
		this.caches.set(domain, fresh);
		return fresh;
	}

	remove(domain: string, instanceId: string) {
		if (!this.domains.has(domain)) return;

		this.domains.get(domain)?.delete(instanceId);
		this.caches.delete(domain);
		this.notify();
	}

	static getInstance() {
		if (!ScopeRegistry.instance) {
			ScopeRegistry.instance = new ScopeRegistry();
		}

		return ScopeRegistry.instance;
	}
}
