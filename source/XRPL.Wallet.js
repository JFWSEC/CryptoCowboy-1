import XRPL from "./XRPL.js";
const xrpl = new XRPL();

import Logger from "./Utility/Logger.js";
const log = new Logger(`XRPL_Wallet`);

import Wallet, { wallet_API } from "./Wallet.js";
export { wallet_API };


export default class XRPL_Wallet extends Wallet
{
	constructor(wallet)
	{
		super(wallet.id);

		this.address = wallet.address;
		this.secret = wallet.secret;

		//this.toString = `hi`;
	}
	/*
		static getWallets(method)
		{
			this.getWallets = method;
		}
	*/
	async getTransactions()
	{
		//	Optional	-	Options to filter the resulting transactions.
		const options =
		{
			//	Optional 	-	boolean	-	If true, the transactions will be sent from the server in a condensed binary format rather than JSON.
			binary: false,	//	Maybe use this one day to be nice to the servers
			//	Optional	-	address	-	If provided, only return transactions with this account as a counterparty to the transaction.
			//counterparty: 
			// earliestFirst	boolean
			//excludeFailures	boolean
			//includeRawTransactions	object
			//initiated	boolean
			limit: 10

			//maxLedgerVersion	integer/string
			//minLedgerVersion	integer/string
			//start	string
			//types	array<transactionType>

		};
		const accountTransactions = await xrpl.getTransactions(this.address, options);
		return accountTransactions;
	}

	async isOrderOpen(hash)
	{
		log.dev(`hash: ${hash}`);

		const transaction = await xrpl.getTransaction(hash).catch((error) => 
		{
			log.error(error);
		});

		const transactionType = transaction.type;
		log.dev(transactionType);

		const balanceChange = transaction.outcome.balanceChanges[transaction.address];
		log.dev(balanceChange);

		const transactionResult = transaction.outcome.result;
		log.dev(transactionResult);
		if (transactionResult == `tesSUCCESS`)
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	async assetBalance(asset)
	{
		log.dev(`assetBalance(asset): ${JSON.stringify(asset)}`);
		const assets = await this.getAssets();
		log.dev(`assets: ${JSON.stringify(assets)}`);

		let result = asset;

		assets.forEach((data) => 
		{
			console.log(data);
			console.log(asset);
			if (data.currency == asset.currency && (data.counterparty == null || data.counterparty == undefined || data.counterparty == asset.counterparty))
			{
				console.log(`data.value: ${data.value}`);
				result = data.value;
			}
		});

		return result;
	}

	async getAssets()
	{
		const result = [];
		const balances = await xrpl.balance(this.address);

		balances.map((balance) => 
		{
			result.push(balance);
		});


		return result;
	}

	async getOpenOrders()
	{
		const orders = await xrpl.getOrders(this.address);
		log.dev(`Orders:`);
		orders.forEach((orders, index) => 
		{
			const specification = orders.specification;
			const direction = specification.direction;
			const quantity = specification.quantity;
			const value = quantity.value;
			const primaryCurrency = quantity.currency;
			const totalPrice = orders.specification.totalPrice;
			const coCurrency = totalPrice.currency;
			const coValue = totalPrice.value;

			log.dev(`${index + 1}: ${direction} ${value} ${primaryCurrency} for ${coValue} ${coCurrency}`);
		});
		return orders;
	}

	async cancelAllOrders()
	{
		const orders = await this.getOpenOrders();

		for (let i = 0; i < orders.length; i++)
		{
			await this.cancelOrder(orders[i].properties.sequence).catch((error) => 
			{
				log.error(`An error has occurred`);
				log.error(error);
				return false;
			});

			if (i == orders.length - 1)
			{
				return true;
			}
		}
	}

	async cancelOrder(orderSequence)
	{
		log.verbose(`Canceling order number ${orderSequence}`);
		return await xrpl.cancelOrder(this.address, this.secret, orderSequence);
	}

	async buy(buyAsset, costAsset, memos)
	{


		//if (memos != null && memos != undefined)
		//{
		//	buyAssetRippleFormat.memos = memos;
		//}

		log.dev(`Placing buy order`);
		return await xrpl.buy(this.address, this.secret, buyAsset, costAsset, memos);
	}

	async sell(sellAsset, costAsset, memos)
	{
		/*
		* @type {import("ripple-lib/dist/npm/common/types/objects").Amount}
		*/
		/*
		const sellAssetRippleFormat =
		{
			value: sellAsset.value,
			currency: sellAsset.currency
		};

		if (sellAsset.counterparty != null && sellAsset.counterparty != undefined)
		{
			sellAssetRippleFormat.counterparty = sellAsset.counterparty;
		}

		if (memos != null && memos != undefined)
		{
			sellAssetRippleFormat.memos = memos;
		}
*/
		/*
		 * @type {import("ripple-lib/dist/npm/common/types/objects").Amount}
		 */
		/*
		const costAssetRippleFormat =
		{
			value: costAsset.value,
			currency: costAsset.currency
		};

		if (costAsset.counterparty != null && costAsset.counterparty != undefined)
		{
			costAssetRippleFormat.counterparty = costAsset.counterparty;
		}
*/
		log.dev(`Placing sell order`);
		return await xrpl.sell(this.address, this.secret, sellAsset, costAsset, memos);
	}
}