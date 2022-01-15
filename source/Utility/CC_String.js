

import Logger from "./Logger.js";
const log = new Logger(`String`);

const _string = new Map();


export default class CC_String
{
	constructor(setString)
	{
		_string.set(this, setString);
	}

	get string()
	{
		return _string.get(this);
	}

	pop()
	{
		const lastLetter = getLastLetter(this.string);
		_string.set(this, removeLastLetter(this.string));
		return lastLetter;
	}
}

function getLastLetter(string)
{
	const result = string[string.length - 1];
	log.dev(`getLastLetter(): return ${result}`);
	return string[string.length - 1];
}

function Integer(number)
{
	const isInt = parseInt(number);
	if (!isNaN(isInt))
	{
		return isInt;
	}
	return false;
}

function removeLastLetter(string)
{
	return string.substring(0, string.length - 1);
}

function getLastInteger(string)
{
	let result = ``;

	while (!isNaN(parseInt(getLastLetter(string))))
	{
		result = (result + getLastLetter(string));
		string = removeLastLetter(string);
	}

	const integer = parseInt(result);

	if (!isNaN(integer))
	{
		return integer;
	}
	else
	{
		return false;
	}
}

function removeLastInteger(string)
{
	while (!isNaN(parseInt(getLastLetter(string))))
	{
		string = removeLastLetter(string);
	}
	return string;
}

export { getLastInteger, removeLastInteger };