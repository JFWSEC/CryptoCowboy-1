import fs from "fs";

function ReadFileSync(fileName)
{
	return fs.readFileSync(fileName, `utf8`);
}

async function ReadFileAsync(fileName)
{
	return new Promise((resolve, reject) => 
	{
		fs.readFile(fileName, `utf8`, function (error, data)
		{
			if (error)
			{
				reject(error);
				return;
			}
			else
			{
				resolve(data);
				return;
			}
		});
	});
}

function WriteFileSync(fileName, data)
{
	return fs.writeFileSync(fileName, data, `utf8`);
}

async function WriteFileAsync(fileName, data)
{
	return new Promise((resolve, reject) => 
	{
		fs.writeFile(fileName, data, `utf8`, function (error)
		{
			if (error)
			{
				reject(error);
				return;
			}
			else
			{
				resolve(true);
				return;
			}
		});
	});
}

function replaceInFileSync(fileName, oldText, newText)
{
	const data = ReadFileSync(fileName);

	const search = new RegExp(oldText, `g`);

	const result = data.replace(search, newText);

	WriteFileSync(fileName, result);
}

async function replaceInFileAsync(fileName, oldText, newText)
{
	const data = await ReadFileAsync(fileName);

	const search = new RegExp(oldText, `g`);

	const result = data.replace(search, newText);

	const error = await WriteFileAsync(fileName, result);
	if (error)
	{
		return false;
	}
	else
	{
		return true;
	}
}

export { replaceInFileAsync };