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
    ApiKey: process.env.ApiKey
}