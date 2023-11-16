import { LogLevel, SapphireClient } from "@sapphire/framework"
import { GatewayIntentBits } from "discord.js"
require("dotenv").config()

export const Client = new SapphireClient({
  defaultPrefix: "!",
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  loadMessageCommandListeners: true,
  logger: {
    level: LogLevel.Info,
  },
  shards: "auto",
})

const main = async () => {
  try {
    Client.logger.info("Logging in")
    await Client.login(process.env.TOKEN)
    Client.logger.info("Logged in")
  } catch (error) {
    Client.logger.fatal(error)
    Client.destroy()
    process.exit(1)
  }
}

main()
