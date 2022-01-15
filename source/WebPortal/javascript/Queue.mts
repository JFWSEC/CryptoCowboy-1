
export default class Queue
{
	constructor(work, timeout)
	{
		console.log(`Queue contructor`);
		//	Work must return bool
		this.work = work;

		this.working = false;
		this.items = [];

		this.pause = false;

		this.timeout = 1000;
		if (timeout)
		{
			this.timeout = timeout;
		}

		this.maxQueueLength = 100;
	}

	add(item)
	{
		//console.log(`Queueing:`);
		//console.log(item);
		this.items.push(item);
		this.doWork();

		if (this.items.length >= this.maxQueueLength)
		{
			this.items.shift();
		}
	}

	get length()
	{
		return this.items.length;
	}

	Pause()
	{
		this.pause = true;
	}

	Start()
	{
		//console.log(`Starting`);
		this.pause = false;
		this.doWork();
	}



	async doWork()
	{
		if (this.pause)
		{
			//console.log(`F`);
			this.working = false;
			return;
		}
		//console.log(`Doing work...`);
		if (this.working == true)
		{
			//console.log(`Worker Busy.`);
			return;
		}
		this.working = true;

		if (this.items.length == 0)
		{
			//console.log(`Work done.`);
			//console.log(`F`);
			this.working = false;
			return;
		}

		const item = this.items[0];

		const result = await this.work(item);

		//console.log(`Result: ${result}`);
		if (result)
		{
			this.items.shift();
			console.log(`Got true result`);
			//this.working = false;
			this.doWork();
		}
		else
		{
			console.log(`Got false result`);
			this.working = false;
			this.delay = setTimeout(() => 
			{
				this.doWork();
			}, this.timeout);
		}
	}
}