import { useSyncExternalStore } from "react";
import { ScopeRegistry } from "#/lib/command/v2/scope-registry";

export function useGetInstances(domain: string) {
	return useSyncExternalStore(
		(callback) => ScopeRegistry.getInstance().subscribe(callback),
		() => ScopeRegistry.getInstance().getInstances(domain),
	);
}
