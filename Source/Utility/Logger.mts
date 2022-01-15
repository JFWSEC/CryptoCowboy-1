
import fs from "fs";

// const devColor = `\x1b[35m`;	//	Highlight
// const debugColor = `\x1b[96m`;	//	Grey
// const verboseColor = `\x1b[90m`; 	//	White
const infoColor = `\x1b[0m`;	//	Bright White
const warningColor = `\x1b[1m\x1b[33m`;	//	Yellow
const errorColor = `\x1b[1m\x1b[31m`;	//	Red
const successColor = `\x1b[1m\x1b[32m`;	//	Green

const title = `\x1b[1m\x1b[37m`;

const reset = `\x1b[0m`;	//	White

var lastModule = ``;

function parseType(data)
{
	if (typeof (data) == `string`)
	{
		return data + "\n";
	}
	else
	{
		return (`\n${JSON.stringify(data, null, 2)}\n`);
	}
}

const logQueue = [];
var writing = false;

function saveLog(fileName, data)
{
	logQueue.push({ type: fileName, data: data });
	handleLogQueue();
}

function handleLogQueue()
{
	if (logQueue.length == 0 || logQueue[0] == undefined || writing)
	{
		return;
	}

	writing = true;
	const nextLine = logQueue.shift();

	const directory = `logs`;

	if (!fs.existsSync(directory))
	{
		fs.mkdirSync(directory);
	}

	fs.open(`${directory}/${nextLine.type}.log`, `a+`, (err, fd) =>
	{
		if (err)
		{
			if (err.code === `EEXIST`)
			{
				console.error(`myfile already exists`);
				return;
			}
			throw err;
		}

		fs.appendFile(fd, nextLine.data, `utf8`, (err) =>
		{
			fs.close(fd, (err) =>
			{
				if (err)
				{
					throw err;
				}

				if (logQueue.length > 0)
				{
					handleLogQueue();
				}
				else
				{
					writing = false;
				}
			});

			if (err)
			{
				throw err;
			}
		});
	});
}
function dateFormat(date, fstr, utc)
{
	utc = utc
		? 'getUTC'
		: 'get';
	return fstr.replace(/%[YmdHMS]/g, function (m)
	{
		switch (m)
		{
			case '%Y': return date[utc + 'FullYear'](); // no leading zeros required
			case '%m': m = 1 + date[utc + 'Month'](); break;
			case '%d': m = date[utc + 'Date'](); break;
			case '%H': m = date[utc + 'Hours'](); break;
			case '%M': m = date[utc + 'Minutes'](); break;
			case '%S': m = date[utc + 'Seconds'](); break;
			default: return m.slice(1); // unknown code, remove %
		}
		// add leading zero if required
		return ('0' + m).slice(-2);
	});
}

function localTime()
{
	return dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", false);
}

export default class Logger
{
	constructor(id)
	{
		this.id = id;
	}
	info(data)
	{
		const message = parseType(data);

		this.group();

		console.log(`${localTime()}: ${title}${this.id}: ${infoColor}${message}${reset}`);
		saveLog(`info`, localTime() + ": " + message);
	}
	warning(data)
	{
		const message = parseType(data);

		this.group();

		console.log(`${localTime()}: ${title}${this.id}: ${warningColor}${message}${reset}`);
		saveLog(`info`, `${localTime()}: Warning: ${message}`);
		saveLog(`warning`, `${localTime()}: Warning: ${message}`);
	}

	//	Logging messages for critial issues
	error(data)
	{
		this.group();

		if (typeof (data) != `string`)
		{
			console.error(data);
		}
		else
		{
			console.log(`${localTime()}: ${title}${this.id}: ${errorColor}${data}${reset}`);
			saveLog(`info`, `${localTime()}: Error: ${data}`);
			saveLog(`warning`, `${localTime()}: Error: ${data}`);
			saveLog(`error`, `${localTime()}: Error: ${data}`);
		}
	}
	success(data)
	{
		const message = parseType(data);

		this.group();

		console.log(`${localTime()}: ${title}${this.id}: ${successColor}${message}${reset}`);
		saveLog(`info`, `${localTime()}: Success: ${data}`);
		saveLog(`info`, `${localTime()}: Success: ${data}`);
	}

	group()
	{
		if (lastModule != this.id)
		{
			console.log(` `);
			lastModule = this.id;
		}
	}
}