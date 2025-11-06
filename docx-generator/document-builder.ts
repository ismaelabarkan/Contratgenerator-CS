import Handlebars from "handlebars";
import helpers from "handlebars-helpers";
import type { DataModel } from "./data-model";

export async function fileTemplate(template: string, data: Partial<DataModel>) {
	const definitionsTemplate = Handlebars.compile(template, {});
	const rendered = definitionsTemplate(data, { helpers: helpers() });
	return rendered;
}
