# boosters 

[![Join the Discord](https://discordapp.com/api/guilds/601219766258106399/embed.png)](https://discord.gg/ntXkRan)

This bot links Nitro Boosters in the Support server with the Development server for the next major version of the Suggestions bot.

## Creating A Discord Application & Bot
You should have a Discord Bot Application ready and made to work on this bot. If you're not sure how to do that, please follow [this guide](https://github.com/acollierr17/create-a-discord-bot).

A star is always appreciated and if you wish to contribute, feel free to open an [issue](https://github.com/suggestionsbot/boosters/issues) or [pull request](https://github.com/suggestionsbot/boosters/pulls)

## Running Locally
Make sure you have [Node.js](http://nodejs.org/) installed as well as Git SCM [Windows](https://git-scm.com/download/win) | [Mac](https://git-scm.com/download/mac) | [Linux](https://git-scm.com/download/linux) if you're going to go this route. Otherwise, simply clone the repo or download it and unzip it to a folder on your desktop.
```bash
$ git clone git@github.com:suggestionsbot/boosters.git # or fork
$ cd boosters
$ npm install
```
Rename `.env.example` to `.env` and update the file with its respective details. Afterward, start the bot.
```bash
$ npm start
```
The bot should now be live! (Check the console if you need to double check anything.

## Deploying to Heroku
With the included [`Profile`](https://github.com/suggestionsbot/boosters/blob/master/Procfile) you have the option of deploying the bot to Heroku.

Make sure you have [Heroku CLI](https://cli.heroku.com/) installed before proceeding. You will need to download the Heroku Node.js buildpack first before moving along.
```bash
$ heroku create --buildpack https://github.com/heroku/heroku-buildpack-nodejs.git
```
Once the buildpack is installed, you may proceed with deployment.
```bash
$ heroku create
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Minimum Permissions
Down below you will find the minimum permissions for the bot to fully function. Modifiying/removing some of these permissions may cause unwarranted problems.

* Manage Roles `[MANAGE_ROLES]`  
* Kick Members `[KICK_MEMBERS]`  
* Read Messages & View Channel `[VIEW_CHANNEL]`  
* Send Messages `[SEND_MESSAGES]`  
* Embed Links `[EMBED_LINKS]`  
* Read Message History `[READ_MESSAGE_HISTORY]`  

Permission Bit Integer: `268520450`

*Credits to [Joma](https://github.com/jomaoppa) for the README template*
