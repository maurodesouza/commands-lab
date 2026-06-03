import { useState } from "react";
import { twc } from "react-twc";
import { ShowContentV2 } from "#/components/v2/show-content";

const Container = twc.div`w-auto inline-flex flex-col gap-2 border-2 border-gray-200 p-4 rounded`;

const Form = twc.form`flex gap-2 items-center`;

const Input = twc.input`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`;

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`;

const RemoveButton = twc.button`px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600`;

const ItemHeader = twc.div`flex justify-between items-center w-full`;

const Label = twc.span`font-medium text-gray-700`;

type ContentItem = {
	id: string;
	label: string;
};

export function ContentBuilder() {
	const [items, setItems] = useState<ContentItem[]>([]);
	const [inputValue, setInputValue] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!inputValue.trim()) return;

		const newItem: ContentItem = {
			id: crypto.randomUUID(),
			label: inputValue.trim(),
		};

		setItems((prev) => [...prev, newItem]);
		setInputValue("");
	}

	function handleRemove(id: string) {
		setItems((prev) => prev.filter((item) => item.id !== id));
	}

	return (
		<Container>
			<Form onSubmit={handleSubmit}>
				<Input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Enter label..."
				/>
				<Button type="submit" disabled={!inputValue.trim()}>
					Add Content
				</Button>
			</Form>

			<div className="flex flex-col gap-4 items-start">
				{items.map((item) => (
					<ShowContentV2.Provider key={item.id} id={item.id} label={item.label}>
						<ShowContentV2.Container>
							<ItemHeader>
								<Label>{item.label}</Label>
								<RemoveButton
									type="button"
									onClick={() => handleRemove(item.id)}
								>
									Remove
								</RemoveButton>
							</ItemHeader>
							<ShowContentV2.Controls>
								<ShowContentV2.Show.Greeting />
								<ShowContentV2.Show.Farewell />
								<ShowContentV2.Show.Thanks />
								<ShowContentV2.Show.Congratulation />
							</ShowContentV2.Controls>
							<ShowContentV2.Preview />
						</ShowContentV2.Container>
					</ShowContentV2.Provider>
				))}
			</div>
		</Container>
	);
}
