import {
	AlignmentType,
	File,
	type FileChild,
	HeadingLevel,
	Packer,
	PageBreak,
	Paragraph,
	type ParagraphChild,
	TableOfContents,
	TextRun,
	twipsMeasureValue,
} from "docx";
import { marked, type Token, type TokensList } from "marked";
import { data } from "./data";
import { fileTemplate } from "./document-builder";

const files = [
	"partijen",
	"overwegingen",
	"definities",
	"deel_1",
	"deel_3_1",
	"deel_3_2",
	"deel_3_3",
	"deel_3_4",
	"deel_3_5",
	"deel_3_6",
	"deel_3_7",
	"ondertekening",
];

const levelToHeadingLevel: Record<
	number,
	(typeof HeadingLevel)[keyof typeof HeadingLevel]
> = {
	1: HeadingLevel.HEADING_1,
	2: HeadingLevel.HEADING_2,
	3: HeadingLevel.HEADING_3,
	4: HeadingLevel.HEADING_4,
	5: HeadingLevel.HEADING_5,
	6: HeadingLevel.HEADING_6,
};

function handleParagraphChildren(tokens?: Token[]): readonly ParagraphChild[] {
	const result: ParagraphChild[] = [];
	for (const child of tokens ?? []) {
		if (child.type === "text") {
			if (child.tokens) {
				for (const token of child.tokens) {
					if (token.type === "text") {
						result.push(new TextRun({ text: token.text }));
					} else if (token.type === "br") {
						result.push(new TextRun({ break: 1, text: "" }));
					} else if (token.type === "strong") {
						result.push(new TextRun({ bold: true, text: token.text }));
					}
				}
			} else {
				result.push(new TextRun({ text: child.text }));
			}
		} else if (child.type === "br") {
			result.push(new TextRun({ break: 1, text: "" }));
		} else if ("text" in child) {
			result.push(new TextRun({ text: child.text }));
		}
	}

	return result;
}

const paragraphStyles = {
	font: "Times New Roman",
	size: 24,
	color: "#000000",
	bold: false,
	italics: false,
};

const lists: Record<string, { ref: string; instance: number }> = {};

function handleToken(
	token: Token,
	opts: {
		currentList?: string;
		level?: number;
	},
): readonly FileChild[] {
	switch (token.type) {
		case "heading":
			return [
				new Paragraph({
					text: token.text,
					heading: levelToHeadingLevel[token.depth],
				}),
			];
		case "text":
			return [
				new Paragraph({
					text: token.text,
					...paragraphStyles,
				}),
			];
		case "paragraph":
			return [
				new Paragraph({
					children: handleParagraphChildren(token.tokens),
					...paragraphStyles,
				}),
			];
		case "space":
			return [new Paragraph({})];
		case "list": {
			const listId = crypto.randomUUID();

			if (token.ordered) {
				const instanceNum =
					Object.values(lists).filter(({ ref }) => ref === "contract-list")
						.length + 1;

				lists[listId] = {
					ref: "contract-list",
					instance: instanceNum,
				};
			}

			const toks = token.items.flatMap((tok: Token) =>
				handleToken(tok, {
					currentList: token.ordered ? listId : undefined,
					level: opts.level !== undefined ? opts.level + 1 : 0,
				}),
			);

			return toks;
		}
		case "list_item": {
			const list = opts.currentList ? lists[opts.currentList] : undefined;
			const type = "numbering";

			return [
				new Paragraph({
					children: handleParagraphChildren(token.tokens),
					...paragraphStyles,
					[type]: {
						reference: list?.ref ?? "dash-bullets",
						level: opts.level ?? 0,
					},
				}),
			];
		}
		case "strong":
			break;
		case "br":
			break;
		default:
			break;
	}

	return [];
}

function buildDocx(tokens: TokensList): readonly FileChild[] {
	const children: FileChild[] = [];
	for (const token of tokens) {
		children.push(...handleToken(token, {}));
	}
	return children;
}

export function generateDocx(data: Partial<DataModel>) {
    const allChildren: FileChild[] = [];

    for (let i = 0; i < files.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: index is always valid
        const file = files[i]!;
        const definities = await Bun.file(`./src/clauses/${file}.hbs`).text();
        const markdown = await fileTemplate(file, data);
        const tokens = marked.lexer(markdown);
        const children = buildDocx(tokens);

        allChildren.push(...children);
        if (i < files.length - 1) {
            allChildren.push(
                new Paragraph({
                    children: [new PageBreak()],
                }),
            );
        }
    }

    const doc = new File({
        numbering: {
            config: [
                {
                    levels: [
                        {
                            level: 0,
                            text: "%1)", // results in '1)', '2)', etc.
                            alignment: AlignmentType.START,
                            style: {
                                paragraph: {
                                    indent: { left: 720, hanging: 260 },
                                },
                            },
                        },
                        {
                            level: 1,
                        },
                        {
                            level: 2,
                        },
                        {
                            level: 3,
                        },
                    ],
                    reference: "contract-list",
                },
                {
                    reference: "dash-bullets",
                    levels: [
                        {
                            level: 0,
                            text: "-",
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: "1.25cm", hanging: "1.25cm" },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: {
                        size: 24,
                        color: "#000000",
                        font: "Times New Roman",
                    },
                },
            ],
            default: {
                heading1: {
                    next: "Normal",
                    run: {
                        size: 32,
                        bold: true,
                        color: "#000000",
                    },
                },
                heading2: {
                    next: "Normal",
                    run: {
                        size: 28,
                        bold: true,
                        color: "#000000",
                    },
                },
                heading3: {
                    next: "Normal",
                    run: {
                        size: 24,
                        bold: true,
                        color: "#000000",
                    },
                },
            },
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: twipsMeasureValue("2.5cm"),
                            right: twipsMeasureValue("2.5cm"),
                            bottom: twipsMeasureValue("2.5cm"),
                            left: twipsMeasureValue("2.5cm"),
                        },
                    },
                },
                children: [
                    new TableOfContents("Summary", {
                        hyperlink: true,
                        headingStyleRange: "1-5",
                    }),
                    new Paragraph({
                        children: [new PageBreak()],
                    }),
                    ...allChildren,
                ],
            },
        ],
    });

    return docx;
}

// await Bun.write("./docs/contract.docx", await Packer.toBuffer(doc));
