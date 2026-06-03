import { useCallback, useEffect, useState } from "react";
import { twc } from "react-twc";
import { actionsV2, commandV2 } from "#/lib/command/v2";

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Controls = twc.div`flex gap-2 items-center`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600`;

function Increment() {
	return (
		<Button type="button" onClick={() => actionsV2.counter.increment()}>
			Increment
		</Button>
	);
}

function Decrement() {
	return (
		<Button type="button" onClick={() => actionsV2.counter.decrement()}>
			Decrement
		</Button>
	);
}

function Reset() {
	return (
		<Button type="button" onClick={() => actionsV2.counter.reset()}>
			Reset
		</Button>
	);
}

function Preview() {
	const [counter, setCounter] = useState(0);

	const increment = useCallback(async () => {
		setCounter((c) => c + 1);
	}, []);

	const decrement = useCallback(async () => {
		setCounter((c) => c - 1);
	}, []);

	const reset = useCallback(async () => {
		setCounter(0);
	}, []);

	useEffect(() => {
		const dispose1 = commandV2.handle("counter.increment", increment);
		const dispose2 = commandV2.handle("counter.decrement", decrement);
		const dispose3 = commandV2.handle("counter.reset", reset);

		return () => {
			dispose1();
			dispose2();
			dispose3();
		};
	}, [increment, decrement, reset]);

	return <span className="w-full grid place-items-center">{counter}</span>;
}

export const CounterV2 = {
	Container,
	Controls,
	Increment,
	Decrement,
	Reset,
	Preview,
};
