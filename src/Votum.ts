import * as Discord from "discord.js"
import Council from "./Council"
import { container } from "@sapphire/framework"

require("dotenv").config()

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

export default class Votum {
  public static getCouncil(id: Discord.Snowflake): Council {
    if (!container.councilMap) {
      container.councilMap = new Map()
    }
    if (container.councilMap.has(id)) {
      return container.councilMap.get(id)!
    }

    const channel = container.client.channels.cache.get(id)

    if (channel == null) {
      throw new Error("Channel doesn't exist.")
    }

    const council = new Council(channel as Discord.TextChannel)
    container.councilMap.set(id, council)

    return council
  }
}
declare module "@sapphire/pieces" {
  interface Container {
    councilMap: Map<Discord.Snowflake, Council>
  }
}
