import { DatabaseService } from "./databaseService";
const puppeteer = require('puppeteer')
const _ = require('lodash');
import { getRequiredEnvVar } from '../util/getRequiredEnvVar';
import { Category, CategoryStock, Game, StoreEntry } from "../types/storeEntry";

const url = 'https://uk.webuy.com/search?page=<page>&productLineId=<lineid>&productLineName=<linename>&stores=<store>'

export class CexFetchService {
    constructor(
        private databaseService: DatabaseService = new DatabaseService(),
        private currentCategoryCountTotal = 0,
    ){
    };

    public async getDiffForStore(store: string): Promise<StoreEntry > {
        const categories = await this.databaseService.getCategories();
        const past = await this.databaseService.getLastGameEntryForStore(store);
        const current = await this.fetchNewGamesForStore(store, categories);
        

        const diffStock = current.stock.map(stock => {
            let pastStock = past.stock.find((value) => value.category.name === stock.category.name)

            return {
                category: stock.category, 
                games: pastStock ? _.differenceWith(stock.games, pastStock.games, (a: Game, b: Game) => a.name === b.name) : stock.games
            }
        })
        
        return {
            name: store,
            stock: diffStock
        }
    }


    public async fetchNewGamesForStore(store: string, categories: Category[]): Promise<StoreEntry> {
        const storeStock: StoreEntry = {
            name: store,
            stock: []
        }

        for( var category of categories){
            const categoryStock: CategoryStock = {
                category: category,
                games: await this.getGamesForStoreAndCategory(store, category, storeStock)
            }
            storeStock.stock.push(categoryStock);
        }

        await this.databaseService.addGamesToDatabase(storeStock);
        return storeStock;
    }

    public async getGamesForStoreAndCategory(store: string, category: Category, storeStock: StoreEntry): Promise<Game[]>{
        const games: Game[] = []
        try {

            let maxConcurrentPages = parseInt(getRequiredEnvVar("CONCURRENT_PAGES"));
            let page = undefined;
            let args: string[] = []
  

            if(getRequiredEnvVar("PROD")==='true')
            {
                args = [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                  ]
            } else 
            {
                console.log("Dev mode, running with sandbox")
            }
            const browser = await puppeteer.launch({
                'args' : args
              });

            const firstPage = await this.getFirstPage(browser, store, category);

            games.push(...await this.getGameDataFromPage(firstPage, store, category));
            const pageCount = await this.getPageCount(firstPage);
    
            let currentPage: number = 2
            let getPagePromises = []
            while(currentPage <= pageCount)
            {
                getPagePromises.push(this.getNextPage(browser, currentPage, store, category))
                
                if (getPagePromises.length >= maxConcurrentPages || currentPage === pageCount ){
                    const pages = await Promise.all(getPagePromises)

                    const getDataPromises = pages.map((page) => this.getGameDataFromPage(page, store, category));
                    const pageGames = await Promise.all(getDataPromises);
                    const closeTabPromises = pages.map(page => page.close())
                    games.push(...pageGames.flat())
                    await Promise.all(closeTabPromises);
                    getPagePromises = [];
                }
                currentPage++
            }        

            await browser.close()
        } catch (error) {
            console.error(error)
        }

        return games.sort((a, b) => {
            let nameA = a.name.toUpperCase(); // ignore upper and lowercase
            let nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0; // names must be equal
        });
    }


    private async hasNextPage(currentPage: number, page: any): Promise<boolean> {
        if(currentPage == 0)
            return true
        let elements = await page.$$('.ais-Pagination-link');
        let lastElement = elements[elements.length - 2];
        let text = await page.evaluate((element: { textContent: any; }) => element.textContent, lastElement);
        const lastPage = parseInt(text)
        return lastPage > currentPage;
    }

    private async getFirstPage(browser: any, store: string, category: Category){
        //Theres an issue where the page will load fully showing all results without the filter applied and then the filter is applied shortly after,
        //I can't find an easy way to detect when this happens, so the workaround is to determine the total results without filters, and compare the number of 
        //results currently on the page until we see that number is different than the total

        //First get the page with no filters applied so we can determine the total number of results in the category
        let URL = this.buildUrl('', category, 1)   
        console.log(`Getting data for category ${category.name} page 1 using url ${URL}`)
        const page = await browser.newPage()
        const customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
        await page.setUserAgent(customUserAgent);
        await page.goto(URL)
        await page.waitForSelector('.product-title')
        this.currentCategoryCountTotal = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});
        console.log(`Total count is ${this.currentCategoryCountTotal}`)

        //Then we get the page again, with the store filter this time
        URL = this.buildUrl(store, category, 1)
        await page.goto(URL)
        await page.waitForSelector('.product-title')
        let count = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});

        //Wait for the number of results to differ from the known total, then we know the filter has applied
        while (count == this.currentCategoryCountTotal)
        {  
            await this.sleep(10)
            count = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});
        }
        
        return page 
    }

    private async getNextPage(browser: any, pageNo: number, store: string, category: Category){
        const URL = this.buildUrl(store, category, pageNo)   
        console.log(`Getting data for category ${category.name} page ${pageNo} using url ${URL}`)
        const page = await browser.newPage()
        const customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0';
        await page.setUserAgent(customUserAgent);
        await page.goto(URL)
        await page.waitForSelector('.product-title')

        let count = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});
        while (count == this.currentCategoryCountTotal)
        {  
            await this.sleep(10)
            count = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});
        }
        
        return page 
    }

    private async sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
    });
}

    private buildUrl(store: string, category: any, page: number = 1): string {
        return url.replace('<store>', store).replace('<lineid>', category.id).replace('<linename>', category.name).replace('<page>', page.toString());
    }

    private async getPageCount(page: any): Promise<number>{
        
        let count: any = await page.$eval('.ais-Stats .text-base', (element: any) => {return element.textContent});
        console.log(count)
        let perPage = (await page.$$('.search-product-card')).length;
        count = count.replace(',', '')
        const pages = Math.ceil(parseInt(count) / perPage)
        console.log(`${pages} pages`)

        return pages
        
    }

    private async getGameDataFromPage(page: any, store: string, category: Category): Promise<Game[]>{
        const cardTitles = await page.$$eval('.search-product-card .card-title .line-clamp', (elements: any[]) => elements.map((element: { textContent: any; }) => element.textContent));
        const cardSubtitles = await page.$$eval('.search-product-card .card-subtitle', (elements: any[]) => elements.map((element: { textContent: any; }) => element.textContent));
        const prices = await page.$$eval('.search-product-card .product-prices .price-wrapper .product-main-price', (elements: any[]) => elements.map((element: { textContent: any; }) => element.textContent));

        const games: Game[] = cardTitles.map((title: any, index: number) => {
            return {
                name: title,
                price: Number(prices[index].replace(/[^0-9.-]+/g,"")),
                subCategory: cardSubtitles[index],
            };
        });

        return games;
    }

    private async getNextPageRetry(retryCount: number, browser: any, pageNo: number, store: string, category: Category): Promise<any> {
        try {
          return await this.getNextPage(browser, pageNo, store, category);
        } catch (error) {
          console.log("Failed to get page, retrying, retries remaining " + retryCount);
          if (retryCount <= 0) {
            throw error;
          }
          return await this.getNextPageRetry(retryCount - 1, browser, pageNo, store, category);
        }
      }

}