import Events from "events";

//	Global API emitter
const events = new Events();

import Logger from "./Logger.js";
const log = new Logger(`API`);

import Assert from "assert";
const assert = Assert.strict;

const registeredModules = new Map();


class Command
{
	constructor(commandName)
	{
		this.command = commandName;
		this.description = ``;
		this.parameters = [];
		this.action = null;
		this.owner = null;
	}

	describe(description)
	{
		this.description = description;
	}

	addParameter(parameter, description, type, example)
	{
		const parameterData =
		{
			parameter: parameter,
			description: description,
			type: type,
			example: example
		};

		this.parameters.push(parameterData);
	}

	setAction(action)
	{
		this.action = action;
	}

	attach(owner)
	{
		this.owner = owner;
	}

	register()
	{
		this.owner(this);
	}
}


export default class API extends Events
{
	constructor(id)
	{
		super();

		this.id = id;
		registeredModules.set(id, this);

		this.commands = new Map();
		this.consumers = [];

		events.on(this.id, (data) => 
		{
			log.dev(`Global event emitter: local module ${this.id}, data ${data}`);
			const command = data.command;
			//const source = data.source;

			delete data.command;

			this.emit(command, data);
		});

		let description;
		if (id == `API`)
		{
			description = `Query API`;
		}
		else
		{
			description = `Query ${id} API`;
		}

		const queryCommand = this.createCommand(`?`);
		queryCommand.describe(description);
		queryCommand.setAction((data) => 
		{
			log.dev(`${this.id} module got data '${JSON.stringify(data)}' with command '?'`);
			const commands = [];

			this.commands.forEach((value, key) => 
			{
				commands.push({ command: key, description: value });
			});

			const result = {};
			result[this.id] = commands;

			if (this.id == `API`)
			{
				registeredModules.forEach((value, key) => 
				{
					if (key == `API`)
					{
						return;
					}
					value.emit(`?`, data);
				});
			}
			this.response(result);
		});
		queryCommand.register();
	}

	createCommand(commandName)
	{
		const command = new Command(commandName);
		command.attach(this.registerCommand.bind(this));
		return command;
	}

	/**
	 * 
	 * @param {Command} commandData 
	 */
	registerCommand(commandData)
	{
		assert.deepEqual(commandData instanceof Command, true);

		const commandName = commandData.command;

		this.on(commandName, commandData.action);
		this.commands.set(commandName, commandData);

		log.dev(`Registering: '${commandData.command}'. Description: ${commandData.description}`);
	}

	registerConsumer(consumer)
	{
		log.dev(`'${this.id}' is registering consumer '${consumer.id}'`);
		this.consumers.push(consumer);
	}

	registerConsumers(consumers)
	{
		consumers.forEach((consumer) => 
		{
			this.registerConsumer(consumer);
		});
	}

	static request(data)
	{
		const type = data.type;
		const destination = data.destination;
		const source = data.source;
		const command = data.command;

		if (type == `request`)
		{
			delete data.type;
		}
		else
		{
			log.warn(`Invalid Request received: ${data}`);
			return false;
		}

		log.dev(`We received a request for '${destination}' from '${source}' to '${command}'`);
		delete data.destination;

		events.emit(destination, data);
	}

	response(data)
	{
		log.dev(`id ${this.id}, API Response ${data}, consumers: ${this.consumers}`);
		this.consumers.forEach((consumer) => 
		{
			log.dev(`Sending ${data} to consumer ${consumer}`);
			if (this.id == `API`)
			{
				return;
			}
			consumer.emit(`response`, data);
		});
	}
}

const api = new API(`API`);
export { api };