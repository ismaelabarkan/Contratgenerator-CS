export interface DataModel {
	opdrachtgever_naam?: string;
	opdrachtgever_adres?: string;
	opdrachtgever_postcode?: string;
	opdrachtgever_plaats?: string;
	opdrachtgever_kvk?: string;

	opdrachtnemer_naam?: string;
	opdrachtnemer_adres?: string;
	opdrachtnemer_postcode?: string;
	opdrachtnemer_plaats?: string;
	opdrachtnemer_kvk?: string;

	ondertekening_plaats: string;
	ondertekening_datum: string;

	opdrachtgever_voorletters: string;
	opdrachtgever_naam_ondertekening: string;
	opdrachtgever_functie: string;

	opdrachtnemer_voorletters: string;
	opdrachtnemer_naam_ondertekening: string;
	opdrachtnemer_functie: string;

	inkoopmethode: "aanbestedingsprocedure" | "toelatingsprocedure";
	inkoopprocedure: "selectie" | "emvi" | "zonder_emvi";

	alle_aanbieders_contract?: boolean;

	uitvoeringsvariant: "inspanningsgericht" | "outputgericht" | "taakgericht";
	extra_overwegingen?: string[];

	begripsdefinities?: Array<{ begrip?: string; definitie?: string }>;

	jeugdhulp: Array<"jeugdhulp_1" | "jeugdhulp_2" | "jeugdhulp_3">;

	// Deel 1 - Bepalingen
	specifieke_jeugdhulp?: string;
	meerdere_opdrachtnemers: boolean;
	gemeentelijke_inkoopdocumenten_tekst?: string;

	looptijd_begindatum?: string;
	looptijd_einddatum?: string;
	indexering_startdatum?: string;
	verlenging_hoevaak?: string;
	verlenging_maanden?: string;

	documenten_samenstelling: Array<
		| "gemeentelijke_inkoopdocumenten"
		| "bijlagen_deelneming"
		| "bijlagen_inschrijving"
	>;

	documenten_bijlagen_overig: string[];

	// Opzegoptie
	opzegoptie:
		| "opzegoptie_variant1"
		| "opzegoptie_variant2"
		| "opzegoptie_variant3";
	opzegoptie_maanden: string;
	opzegoptie_voorwaarden: string;

	// Clausules en bepalingen
	herzieningsclausule: boolean;
	herzieningsclausule_tekst?: string[];

	bestedingsruimte: boolean;
	opzegging_onvoldoende_inzet: boolean;
	bepaling_18_18plus: boolean;
	bibob: boolean;

	sroi: boolean;
	sroi_voorwaarden?: string;

	extra_bepalingen_deel1?: string[];

	// Deel 2 - Individuele bepalingen (conditioneel)
	individuele_afspraken?: boolean;
	individuele_afspraken_tekst?: string;
}
