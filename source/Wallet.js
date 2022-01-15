import Logger from "./Utility/Logger.js";
const log = new Logger(`Wallet`);

import API from "./Utility/API.js";
const wallet_API = new API(`wallet`);
export { wallet_API };

const _wallets = new Map();

const assetsCommand = wallet_API.createCommand(`wallets`);
assetsCommand.describe(`Returns a list of all wallets`);
assetsCommand.setAction(async (data) => 
{
	console.log(`Wallet set actionn: `, data);
	const response = await Wallet.getWallets();
	console.log(response);

	const result = {};
	result.wallet = response;
	result.wallet[`command`] = `wallets`;

	wallet_API.response(result);
	return result;
});
assetsCommand.register();

/*
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
		*/


export default class Wallet
{
	constructor(id)
	{
		if (this.constructor === Wallet) 
		{
			throw new TypeError(`Abstract class "${Wallet.name}" cannot be instantiated directly.`);
		}
		this.id = id;
		_wallets.set(id, this);
	}

	static async getWallets(method)
	{
		this.getWallets = async () => 
		{
			return await method();
		};
		return;
	}



	/**
	 * @returns {Promise<import("ripple-lib/dist/npm/ledger/balances").Balance[]>}
	 */
	async getAssets()
	{
		throw new TypeError(`Method, 'getAssets' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

	/**
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} asset
	 * @returns {Promise<number>}
	 */
	async assetBalance(asset)
	{
		asset;
		throw new TypeError(`Method, 'assetBalance()' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

	/**
	 * @returns {Promise<import("ripple-lib/dist/npm/ledger/parse/account-order").FormattedAccountOrder[]>}
	 */
	async getOpenOrders()
	{
		throw new TypeError(`Method, 'getOpenOrders()' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

	async cancel(transation)
	{
		transation;
		log.error(`Method, 'cancel(order)' for abstract class '${Wallet.name}' has not been overloaded.`);
		throw new TypeError(`Method, 'cancel(order)' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

	/**
	 * @returns {Promise<boolean>}
	 */
	async cancelAllOrders()
	{
		log.error(`Method, 'cancelAllOrders()' for abstract class '${Wallet.name}' has not been overloaded.`);
		throw new TypeError(`Method, 'cancelAllOrders()' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

	/**
	 * 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} buyAsset 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} costAsset 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Memo} [memos]
	 */
	async buy(buyAsset, costAsset, memos)
	{
		buyAsset;
		costAsset;
		memos;
		throw new TypeError(`Method, 'buy()' for abstract class '${Wallet.name}' has not been overloaded.`);
	}


	/**
	 * 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} sellAsset 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} costAsset 
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Memo} [memos]
	 */
	async sell(sellAsset, costAsset, memos)
	{
		sellAsset;
		costAsset;
		memos;
		throw new TypeError(`Method, 'sell()' for abstract class '${Wallet.name}' has not been overloaded.`);
	}


	async isOrderOpen(orderID)
	{
		orderID;
		throw new TypeError(`Method, 'isOrderOpen(orderID)' for abstract class '${Wallet.name}' has not been overloaded.`);
	}

}
