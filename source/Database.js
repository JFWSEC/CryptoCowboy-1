import sqlite3Module from "sqlite3";
//https://github.com/sqlcipher/sqlcipher
const sqlite3 = sqlite3Module.verbose();

import fs from "fs";
const directory = `database`;
if (!fs.existsSync(directory))
{
	fs.mkdirSync(directory);
}

const databaseFile = `./database/cryptocowboy.db`;

const database = new sqlite3.Database(databaseFile, (err) =>
{
	if (err)
	{
		throw new Error(`Error opening DB`);
	}
});

function close()
{
	database.close((error) =>
	{
		if (error)
		{
			return console.error(error.message);
		}
		console.log(`Database closed`);
	});
}

function csvString(columns)
{
	return columns.reduce((previousValue, currentValue, currentIndex, array, initialValue) =>
	{
		return `${previousValue}, ${currentValue}`;
	});
}

export default class Database
{
	constructor()
	{
		//this.renameColumn(`wallet`, `name`, `id`);
	}

	async execute(...args)
	{
		return new Promise((resolve, reject) =>
		{
			args.push((result, error) =>
			{
				if (error)
				{
					reject(error);
				}
				resolve(result);
			});

			database.serialize(() =>
			{
				database.run.apply(database, args);
			});
		}).catch((error) =>
		{
			console.error(error);
		});
	}

	createTable(tableName, ...columns)	//	Make case-insensitive (if its not already)
	{
		const columnString = csvString(columns);
		const query = `CREATE TABLE IF NOT EXISTS ${tableName}(${columnString})`;

		return this.execute(query).then((result) =>
		{
			console.log(`Created new table! ${tableName}`);
			return result;
		});
	}

	readEntireTable(table)
	{
		return new Promise((resolve, reject) =>
		{
			let query = `SELECT * FROM "${table}"`;

			database.all(query, [], (err, rows) =>
			{
				if (err)
				{
					reject(err);
					throw err;
				}
				//log.debug(rows);
				//log.debug("Rows: " + JSON.stringify(rows));
				resolve(rows);	//	array
			});
		});
	}

	read(table, ...columns)
	{
		const columnString = csvString(columns);

		return new Promise((resolve, reject) =>
		{
			const rows = [];
			database.serialize(() =>
			{
				database.each(`SELECT ${columnString} FROM ${table}`, (error, row) =>
				{
					if (error)
					{
						reject(error);
					}
					else
					{
						rows.push(row);
					}
				},
				(error, n) =>
				{
					if (error)
					{
						reject(error);
					}
					else
					{
						resolve(rows);
					}
				});
			});
		});
	}

	async columnExists(table, column)
	{
		const tableData = await this.readEntireTable(table);
		if(tableData[column])
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	async addColumn(table, column)
	{
		try
		{
			await this.columnExists(table, column);
			console.log(`Column ${column} exists in table ${table}`);
			const query = `ALTER TABLE ${table} ADD COLUMN ${column}`;
			await this.execute(query);
			return true;
		}
		catch (error)
		{
			console.log(`Column ${column} does not exist in table ${table}, adding it.`);
			return false;
		}
	}

	//	TODO: prevent overwrites
	async write(table, rowObject)
	{
		const rowKeys = Object.keys(rowObject);
		const rowKeyString = csvString(rowKeys);

		const rowValues = rowKeys.map((key) =>
		{
			return rowObject[key];
		});

		let valuePlaceholders = rowValues.map((value) => `(?)`).join(`,`);

		const query = `INSERT INTO ${table} (${rowKeyString}) VALUES (${valuePlaceholders})`;

		return await this.execute(query, rowValues);
	}

	async removeTable(table)
	{
		const query = `DROP TABLE IF EXISTS ${table}`;
		//database.serialize(() =>
		//{
		//	database.run(query);
		//});

		await this.execute(query);
	}

	async renameTable(oldTable, newTable)
	{
		const query = `ALTER TABLE ${oldTable} RENAME TO ${newTable}`;
		database.serialize(() =>
		{
			database.run(query);
		});
	}

	async renameColumn(table, oldColumn, newColumn)
	{
		const oldTable = await this.readEntireTable(table);
		if (isNaN(oldTable.length) || oldTable.length == 0)
		{
			console.log(`Can't rename rows`);
			return;
		}
		const oldRowKeys = Object.keys(oldTable[0]);
		const rowKeys = oldRowKeys.map((rowKey) =>
		{
			if (rowKey == oldColumn)
			{
				return newColumn;
			}
			else
			{
				return rowKey;
			}
		});

		await this.createTable(`${table}Temp`, rowKeys);
		await this.execute(`insert into ${table}Temp(${rowKeys}) select ${oldRowKeys} from ${table}`);
		await this.removeTable(`${table}`);
		await this.renameTable(`${table}Temp`, table);
	}














	async updateData(table, setColumn, setValue, whereColumn, whereValue)
	{
		var query = null;
		if (whereColumn == null || whereValue == null)
		{
			query = `UPDATE ${table} SET ${setColumn} = '${setValue}'`;
		}
		else
		{
			query = `UPDATE ${table} SET ${setColumn} = "${setValue}" WHERE ${whereColumn} = "${whereValue}"`;
		}
		await this.execute(query);
	}



	//	*********************************************************
	//	Load All Wallets from Database
	//	*********************************************************

	loadWallets()
	{
		return execute(async () =>
		{
			log.debug(`DB: Loading all wallets from database`);

			let wallets = await readEntireTable(`Wallets`);

			log.debug(`wallets`);

			log.debug(wallets);
			//	Scrub secret key for security
			wallets.forEach(function (wallet)
			{
				delete wallet.secret;
			});
			return wallets;
		});
	}

	loadBots()
	{
		return execute(async () =>
		{
			log.debug(`DB: Loading all bots from database`);

			let botsData = await readEntireTable(`Bots`);

			return botsData;
		});
	}

	deleteBot(bot, callback)
	{
		if (bot.id == null)
		{
			bot.id = ``;
		}
		return execute(async () =>
		{
			log.verbose(`Deleting ${bot.id}`);

			var query = `DELETE FROM bots WHERE id=?`;
			var parameters = [bot.id];

			database.run(query, parameters, function (err)
			{
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				log.verbose(`A row has been deleted`);
				callback();
			});
		});
	}

	async updateBot(bot, callback)
	{
		await exports.deleteBot(bot, () => { });
		await exports.addBot(bot, () => { });
		callback();
	}


	addWallet(address, secret, nickname, callback)
	{
		return execute(async () =>
		{
			log.verbose(`Adding wallet: "${address}" to wallets table.`);

			var query = `INSERT INTO wallets (address, secret, nickname) VALUES (?, ?, ?)`;
			var parameters = [address, secret, nickname];

			database.run(query, parameters, function (err)
			{
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				log.verbose(`A row has been inserted with rowid ${this.lastID}`);
				callback();
			});
		});
	}


	addBot(bot, callback)
	{
		return execute(async () =>
		{
			let first = true;

			log.verbose(`Adding bot: "${bot.id}" to bots table.`);
			console.log(bot);

			var query = `INSERT INTO Bots(`;
			let queryPara = `) VALUES (`;
			let botProperties = generateBotProperties();
			let parameters = [];

			for (let i = 0; i < botProperties.length; i++)
			{
				let property = botProperties[i];

				if (!first)
				{
					query += `, `;
					queryPara += `, `;
				}
				else
				{
					first = false;
				}

				query += property;
				queryPara += `?`;

				let hasProperty = Object.prototype.hasOwnProperty.call(bot, property);
				if (hasProperty)
				{
					parameters.push(bot[property]);
				}
				else
				{
					parameters.push(null);
				}
			}
			query += queryPara;
			query += `)`;

			log.verbose(`Query: ${query}`);

			database.run(query, parameters, function (err)
			{
				for (var key in bot)
				{
					parameters.key = bot[key];
				}
				log.verbose(`parameters`, bot);
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				log.verbose(`A row has been inserted with rowid ${this.lastID}`);
				callback();
			});
		});
	}


	deleteWallet(address, callback)
	{
		if (address == null)
		{
			address = ``;
		}
		return execute(async () =>
		{
			log.verbose(`Deleting ${address}`);

			var query = `DELETE FROM wallets WHERE address=?`;
			var parameters = [address];

			database.run(query, parameters, function (err)
			{
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				log.verbose(`A row has been deleted`);
				callback();
			});
		});
	}

	clearTable(table, callback)
	{
		return execute(async () =>
		{
			log.verbose(`Clearing ${table}`);

			var query = `DELETE FROM ${table}`;

			database.run(query, [], function (err)
			{
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				//log.verbose(`Table has been cleared`);
				//callback();
			});

			query = `VACUUM`;

			database.run(query, [], function (err)
			{
				if (err)
				{
					return console.log(err.message);
				}
				// get the last insert id
				log.verbose(`Table has been cleared`);
				//callback();
			});
		});

	}

	async getWalletSecret(address)
	{
		return this.execute(async () =>
		{
			let secret = await walletSecret(address);
			return secret;
		});
	}


}


//	*********************************************************
//	General Purpose Functions
//	*********************************************************







function deleteItem(table, column, value, callback)
{
	log.verbose(`Deleting ${value}`);
	var query = `DELETE FROM ${table} WHERE ${column}=?`;
	var parameters = [value];

	database.run(query, parameters, function (err)
	{
		if (err)
		{
			return console.log(err.message);
		}
		// get the last insert id
		log.verbose(`A row has been deleted`);
		callback();
	});
}





function walletSecret(address)
{
	return new Promise((resolve, reject) =>
	{
		log.verbose(`Searching for wallet secret key`);
		let sql = `SELECT secret FROM wallets WHERE wallets.address = "${address}"`;
		database.all(sql, [], (err, rows) =>
		{
			if (err)
			{
				reject(err);
				throw err;
			}
			let secret = ``;
			rows.forEach((row) =>
			{
				secret = row.secret;
			});
			resolve(secret);
		});
	});
}
