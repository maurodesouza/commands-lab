import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { twc } from "react-twc";
import { actionsV2, commandV2 } from "#/lib/command/v2";

type ShowContentContext = {
	meta: {
		target: string;
		label: string;
	};
};

const ShowContentContext = createContext<ShowContentContext>(
	{} as ShowContentContext,
);

function useShowContent() {
	const context = useContext(ShowContentContext);
	if (!context) {
		throw new Error(
			"useShowContent must be used within a ShowContent.Provider",
		);
	}
	return context;
}

function Provider(
	props: React.PropsWithChildren<{ id: string; label: string }>,
) {
	return (
		<ShowContentContext.Provider
			value={{ meta: { target: props.id, label: props.label } }}
		>
			{props.children}
		</ShowContentContext.Provider>
	);
}

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Controls = twc.div`flex gap-2 items-center`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600`;

function Preview() {
	const [content, setContent] = useState("Empty");
	const { meta } = useShowContent();

	const show = useCallback(async (content: string) => {
		setContent(content);

		return [true, undefined] as [boolean, undefined];
	}, []);

	useEffect(() => {
		const dispose = commandV2.handle("content.show", show, {
			target: meta.target,
			meta: { label: meta.label },
		});

		return () => {
			dispose();
		};
	}, [meta, show]);

	return <span className="w-full grid place-items-center">{content}</span>;
}

function ShowGreeting() {
	const { meta } = useShowContent();

	return (
		<Button
			type="button"
			onClick={() =>
				actionsV2.content.show("Hello", {
					target: meta.target,
				})
			}
		>
			Show Greeting
		</Button>
	);
}

function ShowFarewell() {
	const { meta } = useShowContent();

	return (
		<Button
			type="button"
			onClick={() =>
				actionsV2.content.show("Goodbye", {
					target: meta.target,
				})
			}
		>
			Show Farewell
		</Button>
	);
}

function ShowThanks() {
	const { meta } = useShowContent();

	return (
		<Button
			type="button"
			onClick={() =>
				actionsV2.content.show("Thank you", {
					target: meta.target,
				})
			}
		>
			Show Thanks
		</Button>
	);
}

function ShowCongratulation() {
	const { meta } = useShowContent();

	return (
		<Button
			type="button"
			onClick={() =>
				actionsV2.content.show("Congratulations!", {
					target: meta.target,
				})
			}
		>
			Show Congratulation
		</Button>
	);
}

export const ShowContentV2 = {
	Provider,
	Container,
	Controls,
	Preview,
	Show: {
		Greeting: ShowGreeting,
		Farewell: ShowFarewell,
		Thanks: ShowThanks,
		Congratulation: ShowCongratulation,
	},
};
