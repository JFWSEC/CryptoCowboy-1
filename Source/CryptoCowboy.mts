// import Wallet from './Wallet.mjs';
// import Logger from "./Utility/Logger.mjs";
// const log = new Logger(`CryptoCowboy`);

// import XRPL_Wallet, { wallet_API } from './XRPL.Wallet.mjs';
// import Algorithm, { algorithm_API } from "./Algorithm.mjs";

// // import WebPortal, { api as webPortal_API } from "./WebPortal.mjs";
// // const webPortal = new WebPortal();
// // webPortal.createHTTPServer(5443);

// // wallet_API.registerConsumer(webPortal_API);
// // algorithm_API.registerConsumer(webPortal_API);

// // import { api } from "./Utility/API.mjs";
// // api.registerConsumer(webPortal_API);

// import Database from './Database.mjs';
// const database = new Database();

// import CLIArgument from "./Utility/CLIArguments.mjs";
// const cliArgument = new CLIArgument();

// cliArgument.registerOption(`wallet`, `add`, async (id, address, secret) =>
// {
// 	const x = `x`;
// 	const secretReplacement = x.repeat(secret.length);

// 	log.dev(`Add Wallet Option selected: ID: ${id}, address: ${address}, secret: ${secretReplacement}`);
// 	log.dev(`Removing Old wallet table`);
// 	database.removeTable(`wallet`);

// 	log.dev(`Creating new wallet table`);
// 	await database.createTable(`wallet`, [`id`, `address`, `secret`]);

// 	log.dev(`Writing wallet data`);
// 	await database.write(`wallet`,
// 		{
// 			id: id,
// 			address: address,
// 			secret: secret
// 		});

// 	log.info(`Added wallet`);
// });

// cliArgument.registerOption(`wallet`, `remove`, () =>
// {
// 	log.dev(`Removing wallet table option selected`);
// 	database.removeTable(`Wallet`);
// });

// var clearOrders = false;
// cliArgument.registerOption(`wallet`, `clearOrders`, () =>
// {
// 	clearOrders = true;
// });

// var inflectionPoint = 0;
// var primeAsset = ``;
// var coAsset = ``;

// cliArgument.registerOption(`algorithm`, `config`, async (iP, pA, cA) =>
// {
// 	database.removeTable(`algorithm`);

// 	await database.createTable(`algorithm`, [`inflectionPoint`, `primeasset`, `coasset`]);

// 	await database.write(`algorithm`,
// 		{
// 			inflectionPoint: iP,
// 			primeasset: pA,
// 			coasset: cA
// 		});

// 	inflectionPoint = iP;
// 	primeAsset = pA;
// 	coAsset = cA;
// });

// cliArgument.registerOption(`test`, `out`, (...args) =>
// {
// 	log.dev(`Test CLIArg: ${args}`);
// });

// cliArgument.registerFlag(`V`, () =>
// {
// 	log.info(`Setting verbose Flag`);
// 	Logger.enableVerboseMode();
// });

// cliArgument.registerFlag(`D`, () =>
// {
// 	log.info(`Setting Debug Flag`);
// 	Logger.enableDebugMode();
// });

// cliArgument.registerFlag(`DD`, () =>
// {
// 	log.info(`Setting Dev Flag`);
// 	Logger.enableDevMode();
// });

// var startAlgo = false;
// cliArgument.registerFlag(`S`, () =>
// {
// 	startAlgo = true;
// });

// cliArgument.execute();

// async function main()
// {
// 	log.info(`Welcome to CryptoCowboy - REMASTERED`);	//	TODO: Include version number

// 	const listOfWallets = await database.read(`wallet`, [`id`, `address`, `secret`]);
// 	log.dev(`${listOfWallets.length} wallets found`);

// 	const getXRPLWallets = async () =>
// 	{
// 		const result = await database.read(`wallet`, [`id`, `address`, `secret`]);
// 		log.info(result);
// 		return result;
// 	};

// 	await Wallet.getWallets(getXRPLWallets);

// 	/**
// 	 * @type Wallet | XRPL_Wallet[]
// 	 */
// 	const wallets = [];
// 	listOfWallets.map((wallet) =>
// 	{
// 		wallets.push(new XRPL_Wallet(wallet));
// 	});

// 	const myWallet = wallets[0];
// 	const assets = await myWallet.getAssets();
// 	assets.map((asset) =>
// 	{
// 		const count = assets.reduce((currencyCount, countCurrency) =>
// 		{
// 			if (isNaN(currencyCount))
// 			{
// 				currencyCount = 0;
// 			}
// 			if (asset.currency == countCurrency.currency)
// 			{
// 				currencyCount++;
// 			}
// 			return currencyCount;
// 		});

// 		if (asset.value == 0)
// 		{
// 			return;
// 		}

// 		if (count > 1)
// 		{
// 			log.dev(`${asset.currency} (${asset.counterparty}): ${asset.value}`);
// 		}
// 		else
// 		{
// 			log.dev(`${asset.currency}: ${asset.value}`);
// 		}
// 	});

// 	if (clearOrders)
// 	{
// 		await myWallet.cancelAllOrders();
// 		process.exitCode = 1;
// 	}

// 	const tableAlgorithm = await database.readEntireTable(`algorithm`);
// 	log.info(`Overwriting old config data`);
// 	log.debug(`Table Algorithm: `);
// 	log.debug(tableAlgorithm);

// 	if (inflectionPoint == 0 && tableAlgorithm[0])
// 	{
// 		inflectionPoint = tableAlgorithm[0].inflectionPoint;
// 	}

// 	let rp = 0;

// 	await database.read(`algorithm`, `rangePercentage`)
// 		.then((data) =>
// 		{
// 			console.log(`read`);
// 			rp = data[0].rangePercentage;
// 			console.log(data);
// 			return true;
// 		})
// 		.catch(async (error) =>
// 		{
// 			console.log(`read fail`);
// 			console.log(`Empty row`, error);
// 		});

// 	if (!rp)
// 	{
// 		rp = 3;
// 		await database.addColumn(`algorithm`, `rangePercentage`).then(async () =>
// 		{
// 			console.log(`add col`);
// 			return database.updateData(`algorithm`, `rangePercentage`, `3`);
// 		}).catch(() =>
// 		{
// 			console.log(`catch col`);
// 			console.log(`error`);
// 		});
// 	}

// 	if (primeAsset == ``)
// 	{
// 		primeAsset = tableAlgorithm[0].primeasset;
// 	}

// 	if (coAsset == ``)
// 	{
// 		coAsset = tableAlgorithm[0].coasset;
// 	}

// 	const algorithm = new Algorithm(myWallet);
// 	algorithm.inflectionPoint = inflectionPoint;
// 	algorithm.rangePercentage = rp;

// 	let primeAssetsSet = false;
// 	let coAssetsSet = false;

// 	assets.forEach((value) =>
// 	{
// 		if (value.currency == primeAsset && !primeAssetsSet)
// 		{
// 			algorithm.primeAsset = value;
// 			primeAssetsSet = true;
// 		}

// 		if (value.currency == coAsset && !coAssetsSet)
// 		{
// 			algorithm.coAsset = value;
// 			coAssetsSet = true;
// 		}
// 	});

// 	if (!primeAssetsSet || !coAssetsSet)
// 	{
// 		log.error(`Assets not properly set.`);
// 		process.exitCode = 1;
// 	}

// 	if (startAlgo)
// 	{
// 		await algorithm.start();
// 	}
// }
// main()
// 	.catch((error) =>
// 	{
// 		log.error(`An error has occured in main!`);
// 		log.error(error);

// 		process.exitCode = 1;
// 	});