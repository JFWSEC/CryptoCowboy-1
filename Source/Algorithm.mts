import { log } from "console";


import XRPL from "./XRPL.mjs";
import { divide } from "./Utility.mjs";

import API from "./Utility/API.mjs";
const algorithm_API = new API(`algorithm`);
export { algorithm_API };

const _orders = new Map();

const _buyOrder = new Map();
const _sellOrder = new Map();

const _inflectionPoint = new Map();
const _rangePercentage = new Map();

const softSaturatedPercent = 0.35;
const saturatedPercent = 0.50;

import Time from "./Utility/Time.mjs";
const { day, minutes } = Time;


let timeout = setTimeout(cancelOrders, day);


function Timeout()
{
	clearTimeout(timeout);
	timeout = setTimeout(cancelOrders, day);
}

import W from './Wallet.mjs';
import WX from './XRPL.Wallet.mjs';


function algorithm(wallet: W | WX)
{

}


export default class Algorithm
{
	constructor()
	{
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
		setInterval(() =>
		{
			if (parseFloat(this.rangePercentage) > parseFloat(this.rangePercentageLow))
			{
				this.rangePercentage = parseFloat(this.rangePercentage) - parseFloat(((parseFloat(this.rangePercentage) - parseFloat(this.rangePercentageLow)) / 10.00));
			}
		}, minutes(40));
	}

	get rangePercentage()
	{
		return _rangePercentage.get(this);
	}

	//	TODO: Error checking
	set rangePercentage(value)
	{
		if (isNaN(value))
		{
			log(this.rangePercentage);
			throw new Error(`Invalid Range percentage`);
		}
		else
		{
			if (value < 0)
			{
				log(this.rangePercentage);
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
			log(ip);
			throw new Error(`Invalid IP`);
		}
		else
		{
			if (ip < 0)
			{
				log(ip);
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
			log(this.inflectionPoint);
			throw new Error(`Invalid New IP`);
		}
		else
		{
			if (value < 0)
			{
				log(this.inflectionPoint);
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
		log(`PrimeAsset: ${this.primeAsset.currency}: ${this.primeAsset.value}`);
		log(`CoAsset: ${this.coAsset.currency}: ${this.coAsset.value}`);

		this.primeAsset.value = await this.wallet.assetBalance(this.primeAsset);
		this.coAsset.value = await this.wallet.assetBalance(this.coAsset);
	}


	get buyPrice()
	{
		log(`Divide: this.rangeLow: ${this.rangeLow}, this.coAsset.value: ${this.coAsset.value}`);
		return XRPL.calculateNumber(divide, this.rangeLow, this.coAsset.value);
	}

	get sellPrice()
	{
		log(`Divide: this.rangeHigh: ${this.rangeHigh}, this.coAsset.value: ${this.coAsset.value}`);
		return XRPL.calculateNumber(divide, this.rangeHigh, this.coAsset.value);
	}

	get buyQuantity()
	{
		log(`Property: buyQuantity = ${this.range.number} / ${this.buyPrice}`);

		return XRPL.calculateNumber(divide, this.range.number, this.buyPrice);
		//return divide(this.range.number, this.buyPrice.number);
	}

	get sellQuantity()
	{
		log(`Property: sellQuantity = ${this.range.number} / ${this.sellPrice}`);

		return XRPL.calculateNumber(divide, this.range.number, this.sellPrice);
		//return divide(this.range.number, this.sellPrice.number);
	}

	async getOpenOrderCount()
	{
		log(`Getting open order count`);

		return wallet.getOpenOrders().then((openOrders) => openOrders.length);
	}

	get orders()
	{
		return _orders.get(this);
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

		log(`Buy() => this.primeAsset: ${this.primeAsset}`);
		log(`Buy() => this.coAsset: ${this.coAsset}`);
		log(`Buying ${JSON.stringify(buy)} for ${JSON.stringify(cost)}`);

		return wallet.buy(buy, cost);
	}

	async sell()
	{
		log(`Selling`);
		const sell = Object.assign({}, this.coAsset);

		sell.value = XRPL.trim(this.sellQuantity.toFixed(6));

		const cost = Object.assign({}, this.primeAsset);
		cost.value = XRPL.trim(this.range.number.toFixed(6));

		log(`selling ${JSON.stringify(sell)} for ${JSON.stringify(cost)}`);

		return wallet.sell(sell, cost);
	}

	async cancelOrders()
	{
		await this.wallet.cancelAllOrders();
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

				log(`We need to place two orders`);

				log(`sell...`);
				this.sellOrder = await this.sell().catch((error) =>
				{
					log.error(`Error Placing Sell Order`);
					log.error(error);
				});

				if (this.lowLiquidity)
				{
					log("Asymmetric order: Not enough liquidity - Omiting buy order.");
					this.asymmetricOrderPlaced = true;
				}
				else
				{
					log(`buy...`);
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

				log(`A trade executed, cancel outstanding orders`);
				log(`It's possible that you placed a previous asymmetric order and restarted the program. Resetting orders anyways.`);

				if (isNaN(this.inflectionPoint) || isNaN((this.range.number * (this.rangePercentage / 100.00) * 0.50)))
				{
					log(`IP NAN`);
				}
				else
				{
					log(`Changing this.inflectionPoint: ${this.inflectionPoint}`);
					const saturatedPoint = (this.inflectionPoint * saturatedPercent);

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
					log(`To new value this.inflectionPoint: ${this.inflectionPoint}`);
				}

				if (isNaN(this.rangePercentage) || isNaN(this.rangePercentageHigh) || isNaN((this.rangePercentageHigh - this.rangePercentage) / 10.00))
				{
					log(`rangePercentageHigh NAN`);
				}
				else
				{
					if (this.rangePercentage < this.rangePercentageHigh)
					{
						log(`this.rangePercentage: ${this.rangePercentage}`);
						this.rangePercentage = parseFloat(this.rangePercentage) + parseFloat(((this.rangePercentageHigh - this.rangePercentage) / 25.00));
						log(`To new value this.rangePercentage: ${this.rangePercentage}`);
					}
				}

				await this.cancelOrders().catch((error) =>
				{
					log(`Error Canceling orders`);
					log(error);
				});
				break;
			case (2):
				log(`Waiting for transaction to occur. No action to perform`);
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