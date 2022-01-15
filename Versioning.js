// @ts-nocheck

import packageJSON from './package.json';

import { getLastInteger, removeLastInteger } from "./source/Utility/CC_String.js";

import Logger from "./source/Utility/Logger.js";
const log = new Logger(`Versioning`);

import { replaceInFileAsync } from "./source//Utility/Files.js";

export default class Versioning
{
	constructor()
	{
		this.files = [`./package.json`, `./README.md`];
		this.version = packageJSON.version;
	}

	async increment()
	{
		const versionNumberArray = this.version.match(/\d+$/g);
		console.log(versionNumberArray);

		const versionNumberString = versionNumberArray[0];
		console.log(versionNumberString);

		const base = this.version.replace(versionNumberString, "");

		const versionNumber = parseInt(versionNumberString);
		console.log(versionNumber);

		const newVersionNumber = versionNumber + 1;
		console.log(newVersionNumber);

		const newVersionNumberString = String(newVersionNumber);
		console.log(newVersionNumberString);

		const result = base + newVersionNumberString;
		console.log(result);

		for (let i = 0; i < this.files.length; i++)
		{
			log.dev(`Replacing '${this.version}' for '${newVersion}' in file '${this.files[i]}'`);
			await replaceInFileAsync(this.files[i], this.version, newVersion);
		}
		process.exit(0);
	}
}