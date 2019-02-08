import { Message } from 'discord.js'
import { CommandMessage, CommandoClient } from 'discord.js-commando'
import Command from '../Command'

export default class PingInactiveCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'pinginactive',
      aliases: ['pingremaining', 'mentionremaining', 'alertothers', 'lazyvoters'],
      description: "Mention the remaining councilmembers who haven't voted yet."
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (this.council.currentMotion == null) {
      return msg.reply('There is no motion active.')
    }

    return msg.reply('These councilors still need to vote:\n\n' + this.council.currentMotion.getRemainingVoters().array().join(' '))
  }
}
