# CryptoCowboy [v2.0.0-alpha.13]

This software is in an early pre-release form and is **not recommended for use**.
Many features are not fully implemented but will be added within the coming weeks/months.
Several modules are incomplete so workarounds were added to allow for temporary basic functionality.

There are many known limitations and the software currently supports only a very narrow set of options.

## Known Limitations
The following are known limitations which are being addressed.
* XRPL Only
* Only 1 Wallet/Trading Algorithm can be added at a time.
* Manual algorithm config, no algorithm flexibility.
* Installation from source only.
* The web interface is disabled for development but is being rolled out.

## Running
To run CryptoCowboy v2.0.0-alpha.13 Using the temporary limited CLI:

* *node --experimental-modules --experimental-json-modules CryptoCowboy.js [options]*
  * Where options uses the following formats:
    * *--[target] command option1 option2 option2*
    * *-[Flag]*

### Config Options

To use a particular XRPL wallet, use:
*--wallet add [Wallet Nickname] [Wallet address] [wallet secret]*

You only need to add the wallet once

Example: *node --experimental-modules --experimental-json-modules CryptoCowboy.js --wallet add myCoolWallet rEwFxXooYNJj4qXKPEnpRPV6MnKUVeZ38r mysupersecretsecretkeydontsharethiswithanyone*

Adding a wallet should be persistent so you should only need to enter that command once. If you run it again, it will override that wallet.

To setup a trading algorithm, use:
Example: *node --experimental-modules --experimental-json-modules CryptoCowboy.js --algorithm config [inflectionPoint] [primeasset] [coasset]*

Example: *node --experimental-modules --experimental-json-modules CryptoCowboy.js --algorithm config 60 USD XRP*

The algorithm is not persistent so you will need to enter this command every time you run your program.

For those who have used CC v1.0, inflectionPoint is an alias for fixedPoint

### Config Flags
As for flags, your options are as follows:

* -V: verbose logging
* -D: debug logging (More verbose)
* -DD: dev logging (Most verbose)
* -S: Start (The algorithm won't start without this)

So a complete command may look like this:

*Example: node --experimental-modules --experimental-json-modules CryptoCowboy.js --wallet add myCoolWallet rEwFxXooYNJj4qXKPEnpRPV6MnKUVeZ38r mysupersecretsecretkeydontsharethiswithanyone --algorithm config 60 USD XRP -DD -S*

The CLI setup is ugly and is only a temporary means for setting up the bot.

To calculate the inflectionPoint, it's the number of 'coAsset' you want to keep times the price of the 'coAsset' with respect to the 'primeAsset'.

If you're unfamiliar with how the algorithm works and have not used the original version, I advise either waiting until a more user friendly version is released or asking for help on our Discord channel.

I will be pushing weekly updates so stay tuned for more.

### Patch Notes
As of Alpha-10, you no longer need to manually pass the 'inflectionPoint' variable every time the program is run. It only needs to be used once.