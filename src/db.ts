import { createPool } from 'mysql2/promise';
import { config } from './config';


export const pool = await createPool({
        host: config.host,
        user: config.user,
        database: config.database,
        password: config.password,
        port:3306,
})