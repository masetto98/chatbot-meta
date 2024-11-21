import { config } from './config';
import { createPool } from 'mysql2';


export const pool = createPool({
        host: config.host,
        user: config.user,
        database: config.database,
        password: config.password,
        port:3306,
})