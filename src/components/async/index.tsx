import { useCallback, useEffect } from "react";
import { twc } from "react-twc";
import { actions, command } from "#/lib/command";
import { useTransition } from "@/hooks/use-transition";

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`;

const TRANSITION_KEY = "my-transition";

function Execute() {
	const isLoading = useTransition([TRANSITION_KEY]);

	return (
		<Button
			disabled={isLoading}
			type="button"
			onClick={() =>
				actions.async.execute(undefined, { transition: [TRANSITION_KEY] })
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
		command.handle("async.execute", sleep);
	}, [sleep]);

	return null;
}

function Preview() {
	const isLoading = useTransition([TRANSITION_KEY]);

	return <span>Is loading: {String(isLoading)}</span>;
}

export const Async = {
	Container,
	Execute,
	Handler,
	Preview,
};
