import path from "path";
import net from "net";
import crypto from "crypto";

import http from "http";
import https from "https";
import fs from "fs";

import WebSocket from "ws";
import url from "url";

import API from "./Utility/API.mjs";

const api = new API(`WebPortal`);
export { api };

const mimeTypes = {
	'.html': `text/html`,
	'.js': `text/javascript`,
	'.css': `text/css`,
	'.json': `application/json`,
	'.png': `image/png`,
	'.jpg': `image/jpg`,
	'.gif': `image/gif`,
	'.svg': `image/svg+xml`,
	'.wav': `audio/wav`,
	'.mp4': `video/mp4`,
	'.woff': `application/font-woff`,
	'.ttf': `application/font-ttf`,
	'.eot': `application/vnd.ms-fontobject`,
	'.otf': `application/font-otf`,
	'.wasm': `application/wasm`
};

function getExtension(url)
{
	let extensionName = String(path.extname(url)).toLowerCase();
	return extensionName;
}

function getContentType(url)
{
	let extensionName = getExtension(url);
	let contentType = mimeTypes[extensionName] || `application/octet-stream`;
	return contentType;
}

function generateCommandMessage(destination, command)
{
	const request =
	{
		type: `command`,
		source: `WebPortal`,
		destination: destination,
		command: command
	};

	return JSON.stringify(request);
}

function generateResponseMessage(destination, command, data)
{
	const request =
	{
		type: `response`,
		source: `WebPortal`,
		destination: destination,
		command: command,
		data: data
	};

	return JSON.stringify(request);
}

/*
const secureContext =
{
	cert: fs.readFileSync(`./ssl/cryptocowboy_tech.crt`),
	ca: fs.readFileSync(`./ssl/cryptocowboy_tech.ca-bundle`),
	key: fs.readFileSync(`./ssl/cryptocowboy_tech.key`)
};
*/

const secureContext =
{
	key: fs.readFileSync(`./keys/privateKey.pem`),
	cert: fs.readFileSync(`./keys/certificate.pem`),
};

//	Redirect http traffic to https
http.createServer(function (request, response)
{
	let url = request.url;
	if (url == `/`)
	{
		url = `/index.html`;
	}
	url = `./source/WebPortal/${url}`;

	let contentType = getContentType(url);

	fs.readFile(url, function (error, content)
	{
		if (error)
		{
			console.error(error);
			if (error.code == `ENOENT`)
			{
				fs.readFile(`./404.html`, function (error, content)
				{
					response.writeHead(404, { 'Content-Type': contentType });
					response.end(content, `utf-8`);
				});
			}
			else
			{
				response.writeHead(500);
				response.end(`Sorry, check with the site admin for error: ` + error.code + ` ..\n`);
			}
		}
		else
		{
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(content, `utf-8`);
		}
	});
}).listen(580);

/*
//	Use this instead for HTTPS
http.createServer(function (req, res)
{
	res.writeHead(301, { "Location": `https://` + req.headers[`host`] + req.url });
	res.end();
}).listen(80);

*/



const webSocket = new WebSocket.Server({ noServer: true });

function broadcast(data)
{
	webSocket.clients.forEach(function each(client)	//	Broadcast
	{
		if (client.readyState === WebSocket.OPEN)
		{
			client.send(data);
		}
	});
}

var reset = true;

webSocket.on(`connection`, function connection(socket, request)
{
	const ip = request.connection.remoteAddress;
	//	or	const ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];

	socket.send(`Ready`);

	if (reset)
	{
		reset = false;

		const resetMessage = generateCommandMessage(`Client`, `Reset`);
		socket.send(resetMessage);
	}

	socket.on(`message`, function (data)
	{
		data = JSON.parse(data);
		socket.send(`ACK: ${data.sequence.toString(10)}`);
		delete data.sequence;

		console.log(`Socket message: ${data}`);
		API.request(data);
	});

	socket.on(`error`, (error) =>
	{
		console.error(error);
	});

	socket.on(`pong`, () =>
	{
		console.log(`Connection response`);
	});

	socket.on(`close`, () =>
	{
		console.log(`Socket closed`);
	});
	/*
		webSocket.on(`request`, function connection(socket, request)
		{
			console.log(`req`);
			API.request(request.data);
			socket.send(`ACK`);
		});*/
});



webSocket.on(`error`, (error) =>
{
	console.error(error);
});

const server = http.createServer();
server.on(`upgrade`, function upgrade(request, socket, head)
{
	const pathname = url.parse(request.url).pathname;
	console.log(pathname);
	if (pathname === `/`)
	{
		webSocket.handleUpgrade(request, socket, head, function done(ws)
		{
			console.log(`Handle Upgrade`);
			webSocket.emit(`connection`, ws, request);
		});
	}
	else
	{
		socket.destroy();
	}
});

server.on(`close`, () =>
{
	console.log(`Socket closed`);
});

server.on(`error`, (error) =>
{
	console.log(error);
});

server.listen(8580);

export default class WebPortal
{
	constructor()
	{

	}

	createHTTPServer(port)
	{
		this.server = https.createServer(secureContext, (request, response) =>
		{
			let url = request.url;
			if (url == `/`)
			{
				url = `/index.html`;
			}
			url = `./source/WebPortal/${url}`;

			let contentType = getContentType(url);

			fs.readFile(url, function (error, content)
			{
				if (error)
				{
					console.error(error);
					if (error.code == `ENOENT`)
					{
						fs.readFile(`./404.html`, function (error, content)
						{
							response.writeHead(404, { 'Content-Type': contentType });
							response.end(content, `utf-8`);
						});
					}
					else
					{
						response.writeHead(500);
						response.end(`Sorry, check with the site admin for error: ` + error.code + ` ..\n`);
					}
				}
				else
				{
					response.writeHead(200, { 'Content-Type': contentType });
					response.end(content, `utf-8`);
				}
			});
		}).listen(port, () =>
		{
			console.log(`HTTPS Server listening`);
		});
	}
}

// `Consumes a response event and exposes the data to a web portal`
api.on(`response`, async (data) =>
{
	console.log(data);
	console.log(`Web portal generated response ${JSON.stringify(data)}`);
	const message = generateResponseMessage(`Client`, `?`, data);
	broadcast(message);
});