import { MysqlAdapter } from './mysqlAdapter'; // Importa la clase extendida
import { config } from './config';

// Crear una instancia del adaptador
const adapterDB = new MysqlAdapter({
    host: config.host,
    user: config.user,
    database: config.database,
    password: config.password,
    port: 3306,
});

// Función para inicializar la base de datos
const initDB = async () => {
    try {
        await adapterDB.init();
        console.log('Base de datos inicializada');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        setTimeout(initDB, 5000); // Reintenta después de 5 segundos
    }
};

export { adapterDB, initDB };




/*import { MysqlAdapter as Database } from '@builderbot/database-mysql';
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
*/

