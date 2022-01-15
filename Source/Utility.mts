



function exists(data)
{
	if (data == null)
	{
		return false;
	}
	else if (data == undefined)
	{
		return false;
	}
	else
	{
		return true;
	}
}


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
/*
function bits(byte, start, stop)
{
	console.log(binary(byte));

	let clearLeft = byte << 7 - stop;
	clearLeft = clearLeft & 255;
	clearLeft = clearLeft >> 7 - stop;

	console.log(binary(clearLeft));

	let clearRight = clearLeft >> start;
	clearRight = clearRight & 255;
	const result = clearRight << start;

	console.log(binary(clearRight));

	return result;
}
*/

export { binary, hex, exists, divide };