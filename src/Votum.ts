import * as Discord from "discord.js"
import * as Commando from "discord.js-commando"
import * as path from "path"
import Command from "./commands/Command"
import Council from "./Council"

require("dotenv").config()

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

class Votum {
  public bot: Commando.CommandoClient
  private councilMap: Map<Discord.Snowflake, Council>

  constructor() {
    this.bot = new Commando.CommandoClient({
      owner: process.env.OWNER,
      // disabledEvents: [
      //   "TYPING_START",
      //   "VOICE_STATE_UPDATE",
      //   "PRESENCE_UPDATE",
      //   "MESSAGE_DELETE",
      //   "MESSAGE_UPDATE",
      //   "CHANNEL_PINS_UPDATE",
      //   "MESSAGE_REACTION_ADD",
      //   "MESSAGE_REACTION_REMOVE",
      //   "MESSAGE_REACTION_REMOVE_ALL",
      //   "CHANNEL_PINS_UPDATE",
      //   "MESSAGE_DELETE_BULK",
      //   "WEBHOOKS_UPDATE",
      // ] as any,
      ws: {
        intents: ["GUILD_MEMBERS", "GUILDS", "GUILD_MESSAGES"],
      },
      commandEditableDuration: 120,
    })

    this.councilMap = new Map()
    this.registerCommands()

    this.bot.on("ready", () => {
      console.log("Votum is ready.")

      this.setActivity()
      setInterval(this.setActivity.bind(this), 1000000)
    })

    this.bot.login(process.env.TOKEN)
  }

  public static bootstrap(): Votum {
    return ((global as any).Votum = new Votum())
  }

  public getCouncil(id: Discord.Snowflake): Council {
    if (this.councilMap.has(id)) {
      return this.councilMap.get(id)!
    }

    const channel = this.bot.channels.cache.get(id)

    if (channel == null) {
      throw new Error("Channel doesn't exist.")
    }

    const council = new Council(channel as Discord.TextChannel)
    this.councilMap.set(id, council)

    return council
  }

  private setActivity(): void {
    this.bot.user?.setActivity("http://eryn.io/Votum")
  }

  private registerCommands(): void {
    this.bot.registry
      .registerGroup("votum", "Votum")
      .registerDefaultTypes()
      .registerDefaultGroups()
      .registerDefaultCommands({
        ping: false,
        commandState: false,
        prefix: false,
        help: true,
        unknownCommand: false,
      })
      .registerCommandsIn(path.join(__dirname, "./commands/votum"))
      .registerTypesIn(path.join(__dirname, "./types"))

    this.bot.dispatcher.addInhibitor((msg) => {
      const council = this.getCouncil(msg.channel.id)

      if (
        council.enabled === false &&
        msg.command &&
        (msg.command as Command).councilOnly
      ) {
        return "outside_council"
      }

      return false
    })
  }
}

export default Votum.bootstrap()
