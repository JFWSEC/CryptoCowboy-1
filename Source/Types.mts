

declare global
{
	type λ<IN = any, OUT = any> = (λﾠinput: IN) => OUT;

	type JsonObject = { [property: string]: Json; };
	type Json =
		| string
		| number
		| JsonObject
		| Json[]
		| boolean
		| null;

}

export { };