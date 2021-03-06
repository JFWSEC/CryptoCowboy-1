import Events from "events";
import { log } from "console";

//	Global API emitter
const events = new Events();

import Assert from "assert";
const assert = Assert.strict;

const registeredModules = new Map();

class Command
{
	description = ``;
	parameters = [];
	action = () => { };
	owner = ``;

	describe(description: string)
	{
		this.description = description;
	}

	addParameter(parameter, description: string, type, example)
	{
		const parameterData =
		{
			parameter,
			description,
			type,
			example
		};

		this.parameters.push(parameterData);
	}

	setAction(action: () => void)
	{
		this.action = action;
	}

	attach(owner: string)
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
	constructor(public id: string)
	{
		super();

		registeredModules.set(id, this);

		this.commands = new Map();
		this.consumers = [];

		events.on(this.id, (data) =>
		{
			log(`Global event emitter: local module ${this.id}, data ${data}`);
			const command = data.command;

			delete data.command;

			this.emit(command, data);
		});

		const description = id === `API`
			? `Query API`
			: `Query ${id} API`;

		const queryCommand = this.createCommand(`?`);
		queryCommand.describe(description);
		queryCommand.setAction((data) =>
		{
			log(`${this.id} module got data '${JSON.stringify(data)}' with command '?'`);
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
	 * @param {Command} commandData
	 */
	registerCommand(commandData)
	{
		assert.deepEqual(commandData instanceof Command, true);

		const commandName = commandData.command;

		this.on(commandName, commandData.action);
		this.commands.set(commandName, commandData);

		log(`Registering: '${commandData.command}'. Description: ${commandData.description}`);
	}

	registerConsumer(consumer)
	{
		log(`'${this.id}' is registering consumer '${consumer.id}'`);
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
			log(`Invalid Request received: ${data}`);
			return false;
		}

		log(`We received a request for '${destination}' from '${source}' to '${command}'`);
		delete data.destination;

		events.emit(destination, data);
	}

	response(data)
	{
		log(`id ${this.id}, API Response ${data}, consumers: ${this.consumers}`);
		this.consumers.forEach((consumer) =>
		{
			log(`Sending ${data} to consumer ${consumer}`);
			if (this.id === `API`)
			{
				return;
			}
			consumer.emit(`response`, data);
		});
	}
}

export const api = new API(`API`);