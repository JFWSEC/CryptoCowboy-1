
import Logger from "./Utility/Logger.mjs";
const log = new Logger(`XRPL`);

import { RippleAPI } from "ripple-lib";
import { TransactionOptions } from "ripple-lib/dist/npm/ledger/transaction";
import { Amount, FormattedOrderSpecification, Memo } from "ripple-lib/dist/npm/common/types/objects";

const mainnet = `wss://s1.ripple.com`;

const options =
{
	server: mainnet,		//	uri string	Optional URI for rippled websocket port to connect to. Must start with wss://, ws://, wss+unix://, or ws+unix://.
	feeCushion: 1.2,		//	number	Optional Factor to multiply estimated fee by to provide a cushion in case the required fee rises during submission of a transaction. Defaults to 1.2.
	maxFeeXRP: `0.001`,	//	string	Optional Maximum fee to use with transactions, in XRP. Must be a string-encoded number. Defaults to '2'.
	timeout: 30000,			//	integer	Optional Timeout in milliseconds before considering a request to have failed.
};
const INTERVAL = 7500;

const API = new RippleAPI(options);

API.on(`connected`, () =>
{
	log.success(`Connected to Rippled Server`);
});

API.on(`disconnected`, (code) =>
{
	// code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server will be 1000 if this was normal closure
	console.log(`disconnected, code:` + code.toString());	//	TODO Handle weirdness here
});

API.on(`error`, (errorCode, errorMessage) =>
{
	console.log(`Ripple API Error`);
	console.log(errorCode + `: ` + errorMessage);	//	TODO Handle weirdness here
});

async function connect()
{
	if (API.isConnected())
	{
		//log.debug(`Ripple API is already connected`);
	}
	else
	{
		return await API.connect().catch((error) =>
		{
			console.error(error);
			throw new Error(error);
		});
	}
}


// Function to prepare, sign, and submit a transaction to the XRP Ledger.
function submitTransaction(lastClosedLedgerVersion, prepared, secret)
{
	const signedData = API.sign(prepared.txJSON, secret);

	return API.submit(signedData.signedTransaction).then(data =>
	{
		console.log(`Tentative Result: `, data.resultCode);
		console.log(`Tentative Message: `, data.resultMessage);
		// The tentative result should be ignored. Transactions that succeed here can ultimately fail, and transactions that fail here can ultimately succeed.

		// Begin validation workflow
		const options =
		{
			minLedgerVersion: lastClosedLedgerVersion,
			maxLedgerVersion: prepared.instructions.maxLedgerVersion
		};
		return new Promise((resolve, reject) =>
		{
			setTimeout(() => verifyTransaction(signedData.id, options).then(resolve, reject), INTERVAL);
		});
	});
}

// Verify a transaction is in a validated XRP Ledger version
function verifyTransaction(hash, options)
{
	console.log(`Verifying Transaction`);
	return API.getTransaction(hash, options).then(data =>
	{
		console.log(`Final Result: `, data.outcome.result);
		console.log(`Validated in Ledger: `, data.outcome.ledgerVersion);
		console.log(`Sequence: `, data.sequence);
		return data.outcome.result === `tesSUCCESS`;
	}).then(() =>
	{
		return hash;
	}).catch(error =>
	{
		// If transaction not in latest validated ledger, try again until max ledger hit
		if (error instanceof API.errors.PendingLedgerVersionError)
		{
			return new Promise((resolve, reject) =>
			{
				setTimeout(() => verifyTransaction(hash, options)
					.then(resolve, reject), INTERVAL);
			});
		}
		return error;
	});
}

/*
async function disconnect()
{
	if (!API.isConnected())
	{
		console.log(`Ripple API is already disconnected`);
	}
	else
	{
		await API.disconnect().then(() =>
		{
			console.log(`Ripple API disconnected`);
		}).catch((error) =>
		{
			console.error(error);
			throw new Error(error);
		});
	}
}
*/

export default class XRPL
{
	static calculateNumber(f, ...args)
	{
		const numbers = args.map((arg) =>
		{
			if (typeof (arg) == `string`)
			{
				const convertedNumber = parseFloat(arg);
				if (isNaN(convertedNumber))
				{
					throw new Error(`Invalid type ${typeof (arg)} for ${arg}`);
				}
				return convertedNumber;
			}
			else if (typeof (arg) == `number`)
			{
				return arg;
			}
			else
			{
				throw new Error(`Invalid type ${typeof (arg)} for ${arg}`);
			}
		});

		return f.apply(null, numbers);
	}
	static calculateString(f, ...args)
	{
		this.toAssetString(this.calculateNumber(f, ...args));
	}
	static toAssetString(data)
	{
		return XRPL.trim(data.toFixed(6));
	}

	static trim(data)
	{
		let lastChar = data[data.length - 1];
		if (!data.includes(`.`))
		{
			return data;
		}
		while (lastChar == `0`)
		{
			data = data.substring(0, data.length - 1);
			lastChar = data[data.length - 1];
		}
		lastChar = data[data.length - 1];
		if (lastChar == `.`)
		{
			data = data.substring(0, data.length - 1);
		}
		return data;
	}

	async balance(address: string)
	{
		await connect();

		return API.getBalances(address);
	}

	async getOrders(address)
	{
		await connect();

		return API.getOrders(address);
	}

	async getTransactions(address, options)
	{
		return API.getTransactions(address, options);
	}

	async cancelOrder(address, secret, orderSequenceNumber)
	{
		await connect();

		const order =
		{
			"orderSequence": orderSequenceNumber
		};

		const prepared = await API.prepareOrderCancellation(address, order);

		const ledgerVersion = await API.getLedgerVersion();

		return submitTransaction(ledgerVersion, prepared, secret).catch(log.error);
	}

	async getTransaction(hash)
	{
		const options: TransactionOptions =
		{
			includeRawTransaction: true
		};

		return await API.getTransaction(hash);
	}

	async buy(address: string, secret: string, quantity: Amount, totalPrice: Amount, memos: Memo[])
	{
		const order: FormattedOrderSpecification =
		{
			direction: `buy`,
			quantity,
			totalPrice,
			memos
		};

		console.log(`prepareOrder ${address}, ${JSON.stringify(order)}`);

		const prepared = await API.prepareOrder(address, order);
		const ledgerVersion = await API.getLedgerVersion();

		return submitTransaction(ledgerVersion, prepared, secret);
	}

	async sell(address: string, secret: string, sellAsset: Amount, costAsset: Amount, memos: Memo[])
	{
		const order: FormattedOrderSpecification =
		{
			direction: `sell`,
			quantity: sellAsset,
			totalPrice: costAsset,
			memos: memos
		};

		console.log(`prepareOrder ${address}, ${JSON.stringify(order)}`);
		const prepared = await API.prepareOrder(address, order);
		console.log(`prepared ${prepared}, ${JSON.stringify(prepared)}`);

		const ledgerVersion = await API.getLedgerVersion();

		return submitTransaction(ledgerVersion, prepared, secret);
	}

	getAccount(address)
	{
		return API.getAccountInfo(address);
	}
}