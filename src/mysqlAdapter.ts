import { MysqlAdapter as OriginalMysqlAdapter } from '@builderbot/database-mysql';

class MysqlAdapterWithReconnect extends OriginalMysqlAdapter {
    constructor(credentials: any) {
        super(credentials);
        this.setupReconnect();
    }

    setupReconnect() {
        // Maneja los errores de la conexión
        this.db.on('error', (err: any) => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Conexión perdida. Intentando reconectar...');
                this.init().catch(reconnectError => {
                    console.error('Error al reconectar:', reconnectError);
                });
            } else {
                throw err; // Otros errores deben manejarse manualmente
            }
        });
    }
}

export { MysqlAdapterWithReconnect as MysqlAdapter };
