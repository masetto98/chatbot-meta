import { createBot } from '@builderbot/bot'
//import { MemoryDB as Database } from '@builderbot/bot'
import { provider } from './provider'
import { config } from './config'
import templates from './templates'
import { MysqlAdapter as Database } from '@builderbot/database-mysql'

const PORT = config.PORT



const main = async () => {

    const adapterDB = new Database({
        host: config.host,
        user: config.user,
        database: config.database,
        password: config.password,
        port:3306,
    })

    const { handleCtx, httpServer } = await createBot({
        flow: templates,
        provider: provider,
        database: adapterDB,
    })

    
    httpServer(+PORT)
}

main()
