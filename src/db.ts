import { MysqlAdapter as Database } from '@builderbot/database-mysql';
import { config } from './config';

const adapterDB = new Database({
    host: config.host,
    user: config.user,
    database: config.database,
    password: config.password,
    port: 3306,
});

// Exporta la instancia inicializada
const initDB = async () => {
    await adapterDB.init();
    console.log('Base de datos inicializada');
};

export { adapterDB, initDB };


/*import { config } from './config';
import { createPool } from 'mysql2/promise'; 

export const pool = createPool({
  host: config.host,
  user: config.user,
  database: config.database,
  password: config.password,
  port: 3306, // Puerto por defecto de MySQL
  waitForConnections: true, // Esperar conexiones cuando el pool esté lleno
  connectionLimit: 10, // Número máximo de conexiones en el pool
  queueLimit: 0, // Sin límite para solicitudes en espera
  connectTimeout: 10000,
  keepAliveInitialDelay: 10000, // 0 by default.
  enableKeepAlive: true, // false by default.
});*/
