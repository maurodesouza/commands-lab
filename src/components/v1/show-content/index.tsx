import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { twc } from "react-twc";
import { type ActionsV1, CommandV1 } from "#/lib/command/v1";

type ShowContentContext = {
	command: CommandV1;
	actions: ActionsV1;
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

function Provider(props: React.PropsWithChildren) {
	const contextCommand = CommandV1.scope();
	const contextActions = contextCommand.getActionsProxy();

	return (
		<ShowContentContext.Provider
			value={{ command: contextCommand, actions: contextActions }}
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
	const { command } = useShowContent();

	const show = useCallback(async (content: string) => {
		setContent(content);

		return [true, undefined] as [boolean, undefined];
	}, []);

	useEffect(() => {
		const dispose1 = command.handle("content.show", show);

		return () => {
			dispose1();
		};
	}, [command, show]);

	return <span className="w-full grid place-items-center">{content}</span>;
}

function ShowGreeting() {
	const { actions } = useShowContent();

	return (
		<Button type="button" onClick={() => actions.content.show("Hello")}>
			Show Greeting
		</Button>
	);
}

function ShowFarewell() {
	const { actions } = useShowContent();

	return (
		<Button type="button" onClick={() => actions.content.show("Goodbye")}>
			Show Farewell
		</Button>
	);
}

function ShowThanks() {
	const { actions } = useShowContent();

	return (
		<Button type="button" onClick={() => actions.content.show("Thank you")}>
			Show Thanks
		</Button>
	);
}

function ShowCongratulation() {
	const { actions } = useShowContent();

	return (
		<Button
			type="button"
			onClick={() => actions.content.show("Congratulations!")}
		>
			Show Congratulation
		</Button>
	);
}

export const ShowContentV1 = {
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
