
import Queue from "./Queue.js";


var webSocket;
export default class Socket
{
	constructor()
	{
		this.queue = new Queue(this.send.bind(this));

		this.waiting = [];

		this.ready = false;

		this.sequence = 0;

		this.awaitingResponse = new Map();

		this.timeout = 5000;
		this.retries = 10;
	}

	connect()
	{
		webSocket = new WebSocket(`ws://${window.location.hostname}:8080`);

		this.onOpen();
		this.onMessage();
		this.onClose();
	}

	heartbeat()
	{
		this.beat = setInterval(() =>
		{
			if (!this.connected)
			{
				console.log(`Web socket is closed! Reopen it!`);
				this.connect();
			}
		}, 10000);
	}

	get connected()
	{
		return (webSocket.readyState == WebSocket.OPEN);
	}

	send(data)
	{
		//console.log(`this.ready: ${this.ready}`);
		//console.log(`webSocket != undefined: ${webSocket != undefined}`);
		//console.log(`(webSocket.bufferedAmount == 0 && this.connected): ${(webSocket.bufferedAmount == 0 && this.connected)}`);
		//console.log(`(this.queue.length == 0): ${(this.queue.length == 0)}`);

		if (this.ready && webSocket != undefined && (webSocket.bufferedAmount == 0 && this.connected))
		{
			//console.log(`Sending:`);
			//console.log(data);

			webSocket.send(data);
			return true;
		}
		else
		{
			this.queue.add(data);
			return false;
		}
	}

	async deliver(data)
	{
		this.awaitingResponse.set(this.sequence, data);
		data.sequence = this.sequence++;

		const result = () => { this.send(data); };
		return await this.retry(result, data.sequence);
	}


	retry(f, sequence, count)
	{
		if (isNaN(count))
		{
			count = this.retries;
		}

		return new Promise((resolve, reject) => 
		{
			let complete = !this.awaitingResponse.has(sequence);
			if (complete)
			{
				console.log(`success!`);
				resolve(`success`);
				return;
			}

			if (count == 0)
			{
				reject(`Timeout`);
				return;
			}
			//console.log(`Round ${count}`);

			f();

			complete = !this.awaitingResponse.has(sequence);
			if (complete)
			{
				console.log(`success!`);
				resolve(`success`);
				return;
			}

			if (count > 0 && !complete)
			{
				count--;

				setTimeout(() => 
				{
					this.retry(f, sequence, count);
				}, this.timeout);
			}
		});
	}


	subscribe(listener)
	{
		if (this.listener == null || this.listener == undefined)
		{
			this.listener = listener;
			webSocket = new WebSocket(`wss://${window.location.hostname}:8080`);
			this.onOpen();
			this.onMessage();
			this.onClose();

			this.heartbeat();
		}
		else
		{
			this.listener = listener;
		}
	}

	onOpen()
	{
		this.ready = true;
		webSocket.onopen = (event) =>
		{
			console.log(`onopen`);

			webSocket.onerror = () => 
			{
				console.log(`An error occured, clearing interval`);
				//clearInterval(interval);
			};
		};
	}

	onMessage()
	{
		webSocket.onmessage = (socketData) =>
		{
			let data = socketData.data;
			console.log(`data: ${data}`);

			let valid = false;
			try
			{
				JSON.parse(data);
				valid = true;
			}
			catch (error)
			{
				valid = false;
			}

			if (valid)
			{
				data = JSON.parse(data);
			}

			if (data == `Ready`)
			{
				this.queue.Start();
				return;
			}
			else if (typeof (data) == `string` && data.includes(`ACK: `))
			{
				data = data.replace(`ACK: `, ``);
				data = parseInt(data);

				const waitingData = this.awaitingResponse.get(data);
				this.awaitingResponse.delete(data);

				console.log(`Found: ${data}`);
				return;
			}

			if (this.listener == null)
			{

			}
			else
			{
				this.listener(data);
			}
		};
	}

	onClose()
	{
		webSocket.onclose = (evt) =>
		{
			//	Use this opportunity to notifiy all items using socket
			console.log(`Connection closed.`);

		};
	}
}
