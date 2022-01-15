
import Socket from "./Socket.js";
import UI from "./UI.js";

class Request
{
	constructor(destination, command, parameters)
	{
		this.type = `request`;
		this.source = `Client`;
		this.destination = destination;
		this.command = command;
		if (parameters == null || parameters == undefined)
		{
			this.parameters = [];
		}
		else
		{
			this.parameters = parameters;
		}
	}

	toString()
	{
		return JSON.stringify(this);
	}
}


export default class API
{
	/**
	 * 
	 * @param {Socket} socket 
	 * @param {UI} ui 
	 */
	constructor(socket, ui)
	{
		this.ui = ui;
		this.ui.userInteraction(this.userInteractionHandler.bind(this));

		this.socket = socket;
		this.options = new Map();

		this.handleResponse = (response) =>
		{
			const data = response.data;

			const command = response.command;
			//ui.addText(JSON.stringify(command));


			if (command == `Reset`)
			{
				location.reload(true);
			}
			else if (command == `Ready`)
			{

			}
			else if (command == `?`)
			{
				console.log(`data: `, data);
				const keys = Object.keys(data);
				keys.forEach(element =>
				{
					this.options.set(element, data[element]);
				});

				this.ui.add(data);
			}
			else
			{
				this.ui.addText(`Unknown command: ${command}`);
			}
		};

		this.socket.subscribe(this.handleResponse);

		this.queryAPI();
	}


	async queryAPI()
	{
		const request = new Request(`API`, `?`);

		await this.sendRequest(request);
	}


	async userInteractionHandler(data)
	{
		const parameters = data.parameters;
		const values = parameters.map((value) => 
		{
			return document.getElementById(value).value;
		});
		const request = new Request(data.title, data.command, values);
		await this.sendRequest(request);
	}

	async sendRequest(request)
	{
		return await this.socket.deliver(request);
	}
}