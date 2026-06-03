import { useCallback, useEffect } from "react";
import { twc } from "react-twc";
import { useTransitionV2 } from "#/hooks/v2/use-transition";
import { actionsV2, commandV2 } from "#/lib/command/v2";

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`;

const TRANSITION_KEY = "my-transition";

function Execute() {
	const isLoading = useTransitionV2([TRANSITION_KEY]);

	return (
		<Button
			disabled={isLoading}
			type="button"
			onClick={() =>
				actionsV2.async.execute(undefined, { transition: [TRANSITION_KEY] })
			}
		>
			Execute
		</Button>
	);
}

function Handler() {
	const sleep = useCallback(async () => {
		await new Promise((resolve) => setTimeout(resolve, 5000));

		return [true, undefined] as [boolean, undefined];
	}, []);

	useEffect(() => {
		commandV2.handle("async.execute", sleep);
	}, [sleep]);

	return null;
}

function Preview() {
	const isLoading = useTransitionV2([TRANSITION_KEY]);

	return <span>Is loading: {String(isLoading)}</span>;
}

export const AsyncV2 = {
	Container,
	Execute,
	Handler,
	Preview,
};
