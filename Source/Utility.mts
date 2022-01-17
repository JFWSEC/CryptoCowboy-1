export function append(text: string)
{
	return function (data: string)
	{
		return `${data}${text}`;
	};
}

export const Property =
	<P extends string>
		(property: P) =>
		<O extends Record<P, V>, V>
			(data: O) =>
			data[property];


function pipe<A, B, C>(f: λ<A, B>, g: λ<B, C>): (x: A) => C
{
	return (x) => g(f(x));
}

export function Pipe
	<A extends λ, B extends λ, F extends λ[]>
	(...fs: [A, B, ...F]):
	(pipedInput: Parameters<A>[0]) => ReturnType<F extends [...any[], infer G] ? G : B>
{
	const [head, hydra, next, ...rest] = fs;
	const piped = pipe(head, hydra);
	return next ? Pipe(piped, next, ...rest) : piped;
};

function divide(a, b)
{
	return a / b;
}

function hex(data)
{
	const rawHex = data.toString(16);
	const upperCase = rawHex.toUpperCase();
	let pad = upperCase;
	if (pad.length == 1)
	{
		pad = `0x0` + pad;
	}
	else
	{
		pad = `0x` + pad;
	}
	return pad;
}

function binary(data)
{
	let rawBinary = data.toString(2);
	//console.log(`rawBinary: ${rawBinary}, size: ${rawBinary.length}`);
	while (rawBinary.length < 8)
	{
		rawBinary = `0` + rawBinary;
	}
	return rawBinary;
}


export { binary, hex, divide };