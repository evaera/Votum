import * as Commando from 'discord.js-commando'
import { Message } from 'discord.js'
import Votum from '../Votum'
import Council from '../Council'

interface CustomCommandInfo {
  name: string,
  aliases?: string[],
  description: string,
  councilOnly?: boolean,
  adminOnly?: boolean,
  args?: Commando.ArgumentInfo[]
}

export default class Command extends Commando.Command {
  public councilOnly: boolean
  public adminOnly: boolean
  protected council: Council

  constructor (client: Commando.CommandoClient, customInfo: CustomCommandInfo) {
    const info = customInfo as Commando.CommandInfo

    info.group = 'votum'
    info.guildOnly = true
    info.memberName = info.name
    info.argsPromptLimit = 0

    super(client, info)

    this.councilOnly = typeof customInfo.councilOnly === 'undefined' ? true : customInfo.councilOnly
    this.adminOnly = typeof customInfo.adminOnly === 'undefined' ? false : customInfo.adminOnly
  }

  public hasPermission (msg: Commando.CommandMessage): boolean {
    const council = Votum.getCouncil(msg.channel.id)

    if (this.client.isOwner(msg.author)) {
      return true
    }

    if (this.adminOnly) {
      return msg.member.hasPermission('MANAGE_GUILD') || !!msg.member.roles.find('name', 'Votum Admin')
    } else if (council.councilorRole != null) {
      return msg.member.roles.has(council.councilorRole)
    }

    return true
  }

  public async execute (msg: Commando.CommandMessage, args: any, fromPattern?: boolean): Promise<Message | Message[] | undefined> {
    return msg.reply('This command has no implementation.')
  }

  public async run (msg: Commando.CommandMessage, args: any, fromPattern?: boolean): Promise<Message | Message[]> {
    this.council = Votum.getCouncil(msg.channel.id)

    const reply = this.execute(msg, args, fromPattern)

    if (reply == null) {
      return msg.reply('Command executed.')
    }

    return reply as Promise<Message | Message[]>
  }
}
