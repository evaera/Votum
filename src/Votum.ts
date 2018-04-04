import * as path from 'path'
import * as Commando from 'discord.js-commando'
import * as Discord from 'discord.js'
import * as Commands from './commands'
import Command from './commands/Command'
import Council from './Council'

class Votum {
  private bot: Commando.CommandoClient
  private councilMap: Map<Discord.Snowflake, Council>

  constructor () {
    this.bot = new Commando.CommandoClient({
      owner: process.env.OWNER,
      unknownCommandResponse: false
    })

    this.councilMap = new Map()
    this.registerCommands()

    this.bot.login(process.env.TOKEN)

    console.log('Votum is ready.')
  }

  public static bootstrap (): Votum {
    return new Votum()
  }

  public getCouncil (id: Discord.Snowflake): Council {
    if (this.councilMap.has(id)) {
      return this.councilMap.get(id) as Council
    }

    const council = new Council(id)
    this.councilMap.set(id, council)

    return council
  }

  private registerCommands (): void {
    this.bot.registry
      .registerGroup('votum', 'Votum')
      .registerDefaultTypes()
      .registerDefaultGroups()
      .registerDefaultCommands({
        ping: false,
        commandState: false,
        prefix: false,
        help: true
      })
      .registerCommands(Object.values(Commands))

    this.bot.dispatcher.addInhibitor(msg => {
      const council = this.getCouncil(msg.channel.id)

      if (council.enabled === false && (msg.command as Command).councilOnly) {
        return 'outside_council'
      }

      return false
    })
  }
}

export default Votum.bootstrap()
