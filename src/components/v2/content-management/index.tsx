import { useState } from "react";
import { twc } from "react-twc";
import { actionsV2 } from "#/lib/command/v2";
import { useGetInstances } from "#/hooks/v2/use-get-instances";

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Controls = twc.div`flex gap-2 items-center`;

const Select = twc.select`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`;

type Instance = {
	id: string;
	label?: string;
};

const CONTENT_OPTIONS = ["", "Hello", "Goodbye", "Thank you", "Congratulations!"];

export function ContentManagement() {
	const instances = useGetInstances("content");

	const [curInstance, setCurInstance] = useState<Instance | undefined>();
	const [content, setContent] = useState<string>("");

	function onClick() {
		if (!curInstance) return;

		actionsV2.content.show(content, {
			target: curInstance.id,
		});
	}

	return (
		<Container>
			<Controls>
				<Select
					value={curInstance?.id ?? ""}
					onChange={(e) =>
						setCurInstance(
							instances.find((instance) => instance.id === e.target.value),
						)
					}
				>
					<option value="">Select instance...</option>
					{instances.map((instance) => (
						<option key={instance.id} value={instance.id}>
							{instance.label || instance.id}
						</option>
					))}
				</Select>

				<Select
					value={content}
					onChange={(e) => setContent(e.target.value)}
				>
					{CONTENT_OPTIONS.map((item) => (
						<option key={item} value={item}>
							{item || "Select content..."}
						</option>
					))}
				</Select>

				<Button disabled={!curInstance || !content} type="button" onClick={onClick}>
					Show Outside
				</Button>
			</Controls>
		</Container>
	);
}
