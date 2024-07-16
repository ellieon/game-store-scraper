import { Pool } from 'pg'
import { getRequiredEnvVar } from '../util/getRequiredEnvVar';
import { Category, StoreEntry } from '../types/storeEntry'

export class DatabaseService {
    constructor(private pool: Pool = new Pool({connectionString: getRequiredEnvVar('DATABASE_URL')})){
    }

    public async addGamesToDatabase(games: StoreEntry): Promise<void> {
        const query = 'INSERT INTO games ("date", "store", games) VALUES ($1, $2, $3)';
        await this.pool.query(query, [new Date().toISOString(), games.name, games]); 
    }

    public async getLastGameEntryForStore(store: string): Promise<StoreEntry> {
        const isoDate = new Date().toISOString();
        const res = await this.pool.query(`SELECT * FROM games WHERE store = $1 ORDER BY "date" DESC`, [store]);
        if (res.rowCount === 0){
            return {name: store, stock: []}
        }
        return JSON.parse(JSON.stringify(res.rows[0].games));
    }

    public async getById(id: number): Promise<StoreEntry> {
        const res = await this.pool.query(`SELECT * FROM games WHERE id = $1 ORDER BY "date" DESC`, [id]);
        if (res.rowCount === 0){
            return {name: "test", stock: []}
        }
        return JSON.parse(JSON.stringify(res.rows[0].games));
    }

    public async getNextScanDate() {
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'next_scan_date'")
        const dateString = res.rows[0].value
        const date = new Date(dateString)
        return date
    }

    public async setNextScanDate(): Promise<void> {
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'next_scan'")
        //Was the last scan run for morning?
        const morning = res.rows[0].value === "morning"
        console.log("Current scan was " + res.rows[0].value);
        const nextScanString = morning ? 'evening' : 'morning'
        const morningTime = await this.getMorningTime();
        const eveningTime = await this.getEveningTime();
        const nextScanTimeString = morning ? eveningTime : morningTime;

        console.log(nextScanTimeString)
        let [hours, minutes, seconds]: number[] = nextScanTimeString.split(':').map(Number);
        const date = new Date();
        if(!morning)
        {
            date.setDate(date.getDate() + 1);
        }
        date.setUTCHours(hours, minutes, seconds);

        console.log("Next scan is " + nextScanString + " at " + date.toISOString());
        await this.pool.query("UPDATE settings SET value = $1 WHERE key = 'next_scan_date'", [date.toISOString()]);
        await this.pool.query("UPDATE settings SET value = $1 WHERE key = 'next_scan'", [nextScanString]);
        
    }

    public async getUserId(): Promise<string>{
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'user'")
        return res.rows[0].value
    }

    public async getCategories(): Promise<Category[]> {
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'categories'")
        return JSON.parse(res.rows[0].value)
    }

    public async getStores(): Promise<string[]> {
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'stores'")
        return JSON.parse(res.rows[0].value)
    }

    public async getMorningTime(): Promise<string>{
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'morning_time'")
        return  res.rows[0].value
    }

    public async getEveningTime(): Promise<string>{
        const res = await this.pool.query("SELECT value FROM settings WHERE key = 'evening_time'")
        return res.rows[0].value
    }  

}