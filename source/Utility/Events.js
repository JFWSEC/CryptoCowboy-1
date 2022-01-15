"use strict";

import Logger from "./Logger.js";
const logger = new Logger(`Events`);

var events = (function ()

//var events = (() =>
{
	var topics = {};
	var hasProperty = topics.hasOwnProperty;

	return {
		subscribe: (ownerName, topic, listener) =>
		{
			//object1.hasOwnProperty('property1')
			// Create the topic's object if not yet created
			if (Object.prototype.hasOwnProperty.call(topics, topic))
			{
				//console.log(`property exists ${topic}`);
			}
			else
			{
				//console.log(`property  ${topic} does not`);
			}

			if (!hasProperty.call(topics, topic))
			{
				topics[topic] = [];
			}

			if (!hasProperty.call(topics[topic], ownerName))
			{
				var index = topics[topic].push(listener) - 1;

				topics[topic][ownerName] = [];
				topics[topic][ownerName] = true;
			}

			// Provide handle back for removal of topic
			return {
				remove: () =>
				{
					delete topics[topic][index];
				}
			};
		},
		publish: (topic, info) =>
		{
			// If the topic doesn't exist, or there's no listeners in queue, just leave
			if (!hasProperty.call(topics, topic))
			{
				return;
			}

			// Cycle through topics queue, fire!
			topics[topic].forEach((item) =>
			{
				item(info != undefined ? info : {});
			});
		}
	};
})();
//})();
//events();

/**
 * This module allows publishing and subscribing to events.
 * 
 * @example
 * //	Module A:
 * var events = new Events("Module_A");
 * var eventTopic = "myTopic";
 * var eventHandle = events.subscribe("Module_B", eventTopic, (data) =>
 * {
 * 		console.log(data);
 * });
 * 
 * var finishedListening = false;
 * //	When you no longer need the to listen to an event
 * if(finishedListening)
 * {
 * 		eventHandle.remove();
 * }
 * 
 * //	Module B:
 * var events = new Events("Module_B");
 * var eventTopic = "myTopic";
 * var eventData = "Hello World";
 * events.publish(eventTopic, eventData);
 * 
 * //	Expected results:
 * > Module_A subscribed to 'EventTopic'
 * > Module_B published 'EventTopic': 'Hello World'
 * > Module_A received data from 'EventTopic': 'Hello World'
 */
export default class Events
{
	constructor(name)
	{
		this.events = events;
		this.name = name;
	}

	publish(topic, data)
	{
		if (typeof (data) == `object` && !isCyclic(data))
		{
			try
			{
				//console.log(`'` + this.name + `' published '` + topic + `': ` + JSON.stringify(data));
			}
			catch (e)
			{
				console.log(e instanceof TypeError); // true
				console.log(e.message);              // "null has no properties"
				console.log(e.name);                 // "TypeError"
				console.log(e.fileName);             // "Scratchpad/1"
				console.log(e.lineNumber);           // 2
				console.log(e.columnNumber);         // 2
				console.log(e.stack);                // "@Scratchpad/2:2:3\n"
			}
		}
		else if (typeof (data) == `string`)
		{
			//console.log(`'` + this.name + `' published '` + topic + `': ` + data);
		}
		else
		{
			//console.log(`'` + this.name + `' published '` + topic + `'`);
		}
		this.events.publish(this.name + `_` + topic, data);
	}

	subscribe(name, topic, listener)
	{
		if (name != null)
		{
			topic = name + `_` + topic;
		}
		//console.log(`'` + this.name + `' subscribed to '` + topic + `'`);

		this.events.subscribe(this.name, topic, (data) =>
		{
			if (typeof (data) == `object` && !isCyclic(data))
			{
				try
				{
					//console.log(`'` + this.name + `' received '` + topic + `': ` + JSON.stringify(data));
				}
				catch (e)
				{
					console.log(e instanceof TypeError); // true
					console.log(e.message);              // "null has no properties"
					console.log(e.name);                 // "TypeError"
					console.log(e.fileName);             // "Scratchpad/1"
					console.log(e.lineNumber);           // 2
					console.log(e.columnNumber);         // 2
					console.log(e.stack);                // "@Scratchpad/2:2:3\n"
				}
			}
			else if (typeof (data) == `string`)
			{
				//console.log(`'` + this.name + `' received '` + topic + `': ` + data);
			}
			else
			{
				//console.log(`'` + this.name + `' received '` + topic + `'`);
			}
			listener(data);
		});
	}

	remove()
	{
		this.events.remove();
	}
}


function isCyclic(obj)
{
	var seenObjects = [];

	function detect(obj)
	{
		if (obj && typeof obj === `object`)
		{
			if (seenObjects.indexOf(obj) !== -1)
			{
				return true;
			}
			seenObjects.push(obj);
			for (var key in obj)
			{
				if (Object.prototype.hasOwnProperty.call(obj, key) && detect(obj[key]))
				{
					//console.log(obj, "cycle at " + key);
					return true;
				}
			}
		}
		return false;
	}

	return detect(obj);
}

//Object.prototype.hasOwnProperty.call(obj, key)