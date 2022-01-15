
//import { RippleAPI } from "../node_modules/ripple-lib/dist/npm/index.js";
import Logger from "./Utility/Logger.js";
const log = new Logger(`XRPL`);

import RippleAPI_Module from "ripple-lib";
const RippleAPI = RippleAPI_Module.RippleAPI;

const mainNet = `wss://s1.ripple.com`;	// Public rippled server hosted by Ripple, Inc.
//const mainNetFullHistory = `wss://s2.ripple.com`;

const options =
{
	/*
		authorization	string	Optional Username and password for HTTP basic authentication to the rippled server in the format username:password.
		certificate	string	Optional A string containing the certificate key of the client in PEM format. (Can be an array of certificates).
		key	string	Optional A string containing the private key of the client in PEM format. (Can be an array of keys).
		passphrase	string	Optional The passphrase for the private key of the client.
		proxy	uri string	Optional URI for HTTP/HTTPS proxy to use to connect to the rippled server.
		proxyAuthorization	string	Optional Username and password for HTTP basic authentication to the proxy in the format username:password.
		trustedCertificates	array\<string>	Optional Array of PEM-formatted SSL certificates to trust when connecting to a proxy. This is useful if you want to use a self-signed certificate on the proxy server. Note: Each element must contain a single certificate; concatenated certificates are not valid.
	*/
	server: mainNet,	//	uri string	Optional URI for rippled websocket port to connect to. Must start with wss://, ws://, wss+unix://, or ws+unix://.
	feeCushion: 1.2,		//	number	Optional Factor to multiply estimated fee by to provide a cushion in case the required fee rises during submission of a transaction. Defaults to 1.2.
	maxFeeXRP: `0.001`,	//	string	Optional Maximum fee to use with transactions, in XRP. Must be a string-encoded number. Defaults to '2'.
	timeout: 30000,	//	integer	Optional Timeout in milliseconds before considering a request to have failed.
	//trace: true	//	boolean	Optional If true, log rippled requests and responses to stdout.
};
const INTERVAL = 7500;

const API = new RippleAPI(options);
//const Ripple_Balance = API.le

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
		return await API.connect().then(() =>
		{
			//console.log(`Ripple API connected`);
		}).catch((error) =>
		{
			console.error(error);
			throw new Error(error);
		});
	}
}


/* Function to prepare, sign, and submit a transaction to the XRP Ledger. */
function submitTransaction(lastClosedLedgerVersion, prepared, secret)
{
	const signedData = API.sign(prepared.txJSON, secret);

	return API.submit(signedData.signedTransaction).then(data =>
	{
		console.log(`Tentative Result: `, data.resultCode);
		console.log(`Tentative Message: `, data.resultMessage);
		/* The tentative result should be ignored. Transactions that succeed here can ultimately fail,
		   and transactions that fail here can ultimately succeed. */

		// Begin validation workflow
		const options = {
			minLedgerVersion: lastClosedLedgerVersion,
			maxLedgerVersion: prepared.instructions.maxLedgerVersion
		};
		return new Promise((resolve, reject) =>
		{
			setTimeout(() => verifyTransaction(signedData.id, options).then(resolve, reject), INTERVAL);
		});
	});
}

/* Verify a transaction is in a validated XRP Ledger version */
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
		/* If transaction not in latest validated ledger,
		   try again until max ledger hit */
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
	constructor()
	{

	}

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

	/**
	 * @param {string} address
	 * @returns	{Promise<import("ripple-lib/dist/npm/ledger/balances").GetBalances>}
	 */
	async balance(address)
	{
		await connect();

		return await API.getBalances(address);
	}

	async getOrders(address)
	{
		await connect();

		return await API.getOrders(address);
	}

	async getTransactions(address, options)
	{
		return await API.getTransactions(address, options);
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

		return await submitTransaction(ledgerVersion, prepared, secret).catch((error) =>
		{
			log.error(error);
		});

	}

	async getTransaction(hash)
	{
		/**
		 * @type {import("ripple-lib/dist/npm/ledger/transaction").TransactionOptions}
		 */
		const options =
		{
			includeRawTransaction: true
		};

		return await API.getTransaction(hash);
	}


	/**
	 * @param {string} address
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} buyAsset
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} costAsset
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Memo[]} [memos]
	 */
	async buy(address, secret, buyAsset, costAsset, memos)
	{

		/**
		 * @type {import("ripple-lib/dist/npm/common/types/objects").FormattedOrderSpecification}
		 */
		const order =
		{
			direction: `buy`,
			quantity: buyAsset,
			totalPrice: costAsset,
			memos: memos
		};
		console.log(`prepareOrder ${address}, ${JSON.stringify(order)}`);

		const prepared = await API.prepareOrder(address, order);
		const ledgerVersion = await API.getLedgerVersion();

		return await submitTransaction(ledgerVersion, prepared, secret);
	}

	/**
	 * @param {string} address
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} sellAsset
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Amount} costAsset
	 * @param {import("ripple-lib/dist/npm/common/types/objects").Memo[]} [memos]
	 */
	async sell(address, secret, sellAsset, costAsset, memos)
	{
		/**
		 * @type {import("ripple-lib/dist/npm/common/types/objects").FormattedOrderSpecification}
		 */
		const order =
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

		return await submitTransaction(ledgerVersion, prepared, secret);
	}



	async getAccount(address)
	{
		const account = await API.getAccountInfo(address);
		return account;
	}

}