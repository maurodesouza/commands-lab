import { useSyncExternalStore } from "react";
import { InstanceRegistry } from "#/lib/command/v2/instance-registry";

export function useGetInstances(domain: string) {
	return useSyncExternalStore(
		(callback) => InstanceRegistry.getInstance().subscribe(callback),
		() => InstanceRegistry.getInstance().getInstances(domain),
	);
}
