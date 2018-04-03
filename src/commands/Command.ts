import * as Commando from 'discord.js-commando'

interface CustomCommandInfo {
  name: string,
  aliases?: string[],
  description: string,
  args?: Commando.ArgumentInfo[]
}

export default class Command extends Commando.Command {
  constructor (client: Commando.CommandoClient, customInfo: CustomCommandInfo) {
    const info = customInfo as Commando.CommandInfo

    info.group = 'votum'
    info.guildOnly = true
    info.memberName = info.name
    info.argsPromptLimit = 0

    super(client, info)
  }

  hasPermission (msg: Commando.CommandMessage) {
    return true
  }
}
