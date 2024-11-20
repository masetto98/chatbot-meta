import 'dotenv/config'

export const config = {
    PORT:process.env.port ?? 3008,
    //META
    jwtToken: process.env.jwtToken,
    numberId: process.env.numberId,
    verifyToken: process.env.verifyToken,
    version: "v21.0",
    // AI
    Model:process.env.Model,
    ApiKey: process.env.ApiKey,
    //calendar
    CalendarKey:process.env.CALENDAR,
    //mysql
    host: process.env.MYSQL_DB_HOST,
    user: process.env.MYSQL_DB_USER,
    database: process.env.MYSQL_DB_NAME,
    password: process.env.MYSQL_DB_PASSWORD,
    port: process.env.MYSQL_DB_PORT

}