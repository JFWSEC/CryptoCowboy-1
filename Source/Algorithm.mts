import crypto from "crypto";

//import Wallet from "./Wallet.js";
import XRPL from "./XRPL.mjs";
import { divide } from "./Utility.mjs";

import Logger from "./Utility/Logger.mjs";
const log = new Logger(`Algorithm`);

import API from "./Utility/API.mjs";
const algorithm_API = new API(`algorithm`);
export { algorithm_API };

//	Remove DB later
import Database from './Database.mjs';
const database = new Database();

const _id = new Map();
const _orders = new Map();

/**
 * @type {Map<Algorithm, import('./Wallet.js') | import('./XRPL.Wallet.js')>}
 */
const _wallet = new Map();

const _buyOrder = new Map();
const _sellOrder = new Map();

const _inflectionPoint = new Map();
const _rangePercentage = new Map();

const softSaturatedPercent = 0.35;
const saturatedPercent = 0.50;

const everyDay = (24 * 60 * 60 * 1000);

let timeout = setTimeout(() =>
{
	cancelOrders();
}, everyDay);


function Timeout()
{
	clearTimeout(timeout);
	timeout = setTimeout(() =>
	{
		cancelOrders();
	}, everyDay);
}


export default class Algorithm
{
	constructor(wallet, id)
	{
		if (id)
		{
			_id.set(this, id);
		}
		else
		{
			_id.set(this, crypto.randomBytes(64));
		}

		_wallet.set(this, wallet);
		_orders.set(this, []);

		_inflectionPoint.set(this, null);

		_rangePercentage.set(this, 2.25);

		this.rangePercentageLow = 2.00;
		this.rangePercentageHigh = 12.25;

		this.asymmetricOrderPlaced = false;

		/**
		 *
		 * @type {import("ripple-lib/dist/npm/ledger/balances").Balance}
		 */
		this.primeAsset = null;

		/**
		 *
		 * @type {import("ripple-lib/dist/npm/ledger/balances").Balance}
		 */
		this.coAsset = null;
	}



	rangeCooldown()
	{
		const everyDay = (24 * 60 * 60 * 1000);
		const everyHour = (60 * 60 * 1000);
		const everyFourtyFive = (60 * 45 * 1000);
		const everyHalfHour = (30 * 60 * 1000);

		//86400 seconds in a day
		setInterval(() =>
		{
			if (parseFloat(this.rangePercentage) > parseFloat(this.rangePercentageLow))
			{
				this.rangePercentage = parseFloat(this.rangePercentage) - parseFloat(((parseFloat(this.rangePercentage) - parseFloat(this.rangePercentageLow)) / 10.00));
			}
		}, everyFourtyFive);
	}

	get rangePercentage()
	{
		const rp = _rangePercentage.get(this);

		return rp;
	}

	//	TODO: Error checking
	set rangePercentage(value)
	{
		if (isNaN(value))
		{
			log.dev(this.rangePercentage);
			throw new Error(`Invalid Range percentage`);
		}
		else
		{
			if (value < 0)
			{
				log.dev(this.rangePercentage);
				throw new Error(`Invalid Range percentage`);
			}
			else
			{
				_rangePercentage.set(this, value);
				database.updateData(`algorithm`, `rangePercentage`, value);
			}
		}
	}


	get inflectionPoint()
	{
		const ip = _inflectionPoint.get(this);
		if (isNaN(ip))
		{
			log.dev(ip);
			throw new Error(`Invalid IP`);
		}
		else
		{
			if (ip < 0)
			{
				log.dev(ip);
				throw new Error(`Invalid IP`);
			}
			else
			{
				return ip;
			}
		}
	}

	set inflectionPoint(value)
	{
		console.log(value);
		console.log(typeof (value));

		if (isNaN(value))
		{
			log.dev(this.inflectionPoint);
			throw new Error(`Invalid New IP`);
		}
		else
		{
			if (value < 0)
			{
				log.dev(this.inflectionPoint);
				throw new Error(`Invalid New IP`);
			}
			else
			{
				_inflectionPoint.set(this, value);
				database.updateData(`algorithm`, `inflectionPoint`, value);
			}
		}
	}

	get lowLiquidity()
	{
		const bufferedRange = this.range.number * 1.05;
		const result = (bufferedRange > this.primeAsset.value);
		return result;
	}

	get range()
	{
		return {
			number: (parseFloat(this.inflectionPoint) * parseFloat(this.rangePercentage / 100.00)),
			string: XRPL.trim(parseFloat(this.inflectionPoint * parseFloat(this.rangePercentage / 100.00)).toFixed(6))
		};
	}

	get rangeLow()
	{
		return (parseFloat(this.inflectionPoint) - this.range.number);
	}

	get rangeHigh()
	{
		return (parseFloat(this.inflectionPoint) + this.range.number);
	}

	async updateQuantity()
	{
		log.dev(`PrimeAsset: ${this.primeAsset.currency}: ${this.primeAsset.value}`);
		log.dev(`CoAsset: ${this.coAsset.currency}: ${this.coAsset.value}`);

		this.primeAsset.value = await this.wallet.assetBalance(this.primeAsset);
		this.coAsset.value = await this.wallet.assetBalance(this.coAsset);
	}


	get buyPrice()
	{
		log.dev(`Divide: this.rangeLow: ${this.rangeLow}, this.coAsset.value: ${this.coAsset.value}`);
		return XRPL.calculateNumber(divide, this.rangeLow, this.coAsset.value);
	}

	get sellPrice()
	{
		log.dev(`Divide: this.rangeHigh: ${this.rangeHigh}, this.coAsset.value: ${this.coAsset.value}`);
		return XRPL.calculateNumber(divide, this.rangeHigh, this.coAsset.value);
	}

	get buyQuantity()
	{
		log.dev(`Property: buyQuantity = ${this.range.number} / ${this.buyPrice}`);

		return XRPL.calculateNumber(divide, this.range.number, this.buyPrice);
		//return divide(this.range.number, this.buyPrice.number);
	}

	get sellQuantity()
	{
		log.dev(`Property: sellQuantity = ${this.range.number} / ${this.sellPrice}`);

		return XRPL.calculateNumber(divide, this.range.number, this.sellPrice);
		//return divide(this.range.number, this.sellPrice.number);
	}

	async getOpenOrderCount()
	{
		log.verbose(`Getting open order count`);

		const wallet = _wallet.get(this);

		const openOrders = await wallet.getOpenOrders();
		let result = openOrders.length;

		/*
		if (this.buyOrder != null)
		{
			log.dev(`this.buyOrder:`);
			log.dev(this.buyOrder);
			const buyTransaction = await wallet.isOrderOpen(this.buyOrder).catch((error) =>
			{
				log.error(error);
			});
			log.dev(`buyTransaction:`);
			log.dev(buyTransaction);
			result++;
		}
		if (this.sellOrder != null)
		{
			log.dev(this.sellOrder);
			const sellTransaction = await wallet.isOrderOpen(this.sellOrder).catch((error) =>
			{
				log.error(error);
			});
			log.dev(`sellTransaction:`);
			log.dev(sellTransaction);
			result++;
		}
		*/

		return result;
	}

	get orders()
	{
		return _orders.get(this);
	}

	get wallet()
	{
		return _wallet.get(this);
	}

	set order(order)
	{
		const orders = this.orders;
		orders.push(order);
		_orders.set(this, orders);
	}

	get buyOrder()
	{
		return _buyOrder.get(this);
	}

	set buyOrder(order)
	{
		this.order = order;

		_buyOrder.set(this, order);
	}

	get sellOrder()
	{
		return _sellOrder.get(this);
	}

	set sellOrder(order)
	{
		this.order = order;

		_sellOrder.set(this, order);
	}

	async buy()
	{
		const buy = Object.assign({}, this.coAsset);
		buy.value = XRPL.trim(this.buyQuantity.toFixed(6));

		const cost = Object.assign({}, this.primeAsset);
		cost.value = XRPL.trim(this.range.number.toFixed(6));

		log.debug(`Buy() => this.primeAsset: ${this.primeAsset}`);
		log.debug(`Buy() => this.coAsset: ${this.coAsset}`);
		log.debug(`Buying ${JSON.stringify(buy)} for ${JSON.stringify(cost)}`);

		const wallet = _wallet.get(this);

		return await wallet.buy(buy, cost);
	}

	async sell()
	{
		log.dev(`Selling`);
		const sell = Object.assign({}, this.coAsset);

		sell.value = XRPL.trim(this.sellQuantity.toFixed(6));

		const cost = Object.assign({}, this.primeAsset);
		cost.value = XRPL.trim(this.range.number.toFixed(6));

		log.debug(`selling ${JSON.stringify(sell)} for ${JSON.stringify(cost)}`);
		const wallet = _wallet.get(this);
		return await wallet.sell(sell, cost);
	}

	async cancelOrders()
	{
		await this.wallet.cancelAllOrders();

		/*
				if (this.buyOrder)
				{
					this.wallet.cancel(this.buyOrder);
				}
				if (this.sellOrder)
				{
					this.wallet.cancel(this.sellOrder);
				}
				*/
	}


	async start()
	{
		const openOrderCount = await this.getOpenOrderCount().catch((error) =>
		{
			log.error(error);
		});

		await this.updateQuantity();

		switch (openOrderCount)
		{
			case (0):
				Timeout();

				log.verbose(`We need to place two orders`);

				log.verbose(`sell...`);
				this.sellOrder = await this.sell().catch((error) =>
				{
					log.error(`Error Placing Sell Order`);
					log.error(error);
				});

				if (this.lowLiquidity)
				{
					log.debug("Asymmetric order: Not enough liquidity - Omiting buy order.");
					this.asymmetricOrderPlaced = true;
				}
				else
				{
					log.verbose(`buy...`);
					this.buyOrder = await this.buy().catch((error) =>
					{
						log.error(`Error Placing Buy Order`);
						log.error(error);
					});
					this.asymmetricOrderPlaced = false;
				}

				break;
			case (1):

				if (this.asymmetricOrderPlaced)
				{
					log.info(`Detected asymmetric order. Nothing to do for now.`);
					break;
				}

				log.info(`A trade executed, cancel outstanding orders`);
				log.debug(`It's possible that you placed a previous asymmetric order and restarted the program. Resetting orders anyways.`);

				if (isNaN(this.inflectionPoint) || isNaN((this.range.number * (this.rangePercentage / 100.00) * 0.50)))
				{
					log.dev(`IP NAN`);
				}
				else
				{
					log.dev(`Changing this.inflectionPoint: ${this.inflectionPoint}`);
					const saturatedPoint = (this.inflectionPoint * saturatedPercent);
					log.dev("sat");
					const softSaturatedPoint = (this.inflectionPoint * softSaturatedPercent);


					if (this.primeAsset.value > saturatedPoint)
					{
						const saturated = (this.primeAsset.value - saturatedPoint) / 10;
						this.inflectionPoint = parseFloat(parseFloat(this.inflectionPoint) + parseFloat(saturated));
					}

					if (this.primeAsset.value > softSaturatedPoint)
					{
						const softSaturated = (this.primeAsset.value - softSaturatedPoint) / 100;
						this.inflectionPoint = parseFloat(parseFloat(this.inflectionPoint) + parseFloat(softSaturated));
					}

					//console.log("Check");
					//console.log("this.inflectionPoint: " + parseFloat(this.inflectionPoint) + " + " + parseFloat((this.range.number * (this.rangePercentage / 100.00) * 0.50)));
					this.inflectionPoint = parseFloat(this.inflectionPoint) + parseFloat((this.range.number * (this.rangePercentage / 250)));
					log.dev(`To new value this.inflectionPoint: ${this.inflectionPoint}`);
				}

				if (isNaN(this.rangePercentage) || isNaN(this.rangePercentageHigh) || isNaN((this.rangePercentageHigh - this.rangePercentage) / 10.00))
				{
					log.dev(`RPH NAN`);
				}
				else
				{
					if (this.rangePercentage < this.rangePercentageHigh)
					{
						log.dev(`this.rangePercentage: ${this.rangePercentage}`);
						this.rangePercentage = parseFloat(this.rangePercentage) + parseFloat(((this.rangePercentageHigh - this.rangePercentage) / 25.00));
						log.dev(`To new value this.rangePercentage: ${this.rangePercentage}`);
					}
				}

				await this.cancelOrders().catch((error) =>
				{
					log.error(`Error Canceling orders`);
					log.error(error);
				});
				break;
			case (2):
				log.debug(`Waiting for transaction to occur. No action to perform`);
				break;
			default:
				log.error(`Error: This state should never occur. You may have additional orders placed.`);
				this.stop();
				break;
		}

		setTimeout(() =>
		{
			this.start();
		}, 30000);
	}

	stop()
	{

	}
}

const configureCommand = algorithm_API.createCommand(`configure`);
configureCommand.describe(`Configures a bot instance (only 1 instance at a time allowed right now)`);
configureCommand.addParameter(`id`, `Nickname for this algorithm instance`, `string`, `My Mini Bot`);
configureCommand.addParameter(`walletID`, `Name of the wallet to link algorithm to`, `string`, `My XRPL Wallet`);
configureCommand.addParameter(`primeAsset`, `Main currency`, `string`, `USD`);
configureCommand.addParameter(`coAsset`, `Complementary Currency`, `string`, `XRP`);
configureCommand.setAction(async (data) =>
{
	console.log(`Algorithm data `, data);

	algorithm_API.response(data);
	return data;
});
configureCommand.register();