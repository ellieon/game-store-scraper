# game-store-scraper

## About

## Development
### Prerequisites
* A discord developer account, with an application setup, you will need the bot secret token (and to invite the bot to a server to test)
* Docker to run the local database
* node.js and npm, (I use 20.11.0, but it shouldn't be too picky)

### Database
* The `20240610130208-settings-update.js` file in `migrations` seeds the inital settings for the database, here you can define the categories, stores, and user you wish to 
recieve the daily message before you setup the bot,  you just need to change the constants defined at the top to tailor what you want the bot to get for you
* `CATEGORIES` - There are some defined by default, each of  these requires the id of the category and the store name as defined in the query string when using the website
* `STORES` -  The list of stores that will be searched, update these to match  the query string of the stores you want to search
* `USER` - The discord ID of the user to get the daily updates from the bot
* `MORNING_TIME`/`EVENING_TIME` - A HH:mm:ss string of when you want the bot to  run of  a morning and evening each day

### Setup
* Configure the database variables as above
* A docker compose file has been provided to setup the local database, start it by running `docker-compose up`
    * You can access a web interface of this database at `localhost:8080`, default username is `manager`, default password is `password` and default database is `manager`, make sure to select "PostgreSQL" as the database type
* install all dependenices from the root with `npm install`
* dotenv is used for environment variables, in the `scraper-bot` and `scraper-database` packages, copy the `.env.example` file to `.env` in the root of each of these, default variables have been provided but variables for the discord API key will be required
* run `npm run start:bot` to start the local development environment, this will run the database migrations and start the actual bot software itself under nodemon.

## Deployment
* A Procfile for deployment on Heroku has been provided, you will need an app with at least 1 worker dyno, and an attached PostgreSQL database. Note you will have to run the following in your heroku cli for the database to work: `heroku config:set PGSSLMODE=no-verify -a <your-app-name>`





