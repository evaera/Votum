import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'
import Votum from '../../Votum'

export default class YesCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'yes',
      aliases: ['aye', 'si', 'yea', 'yay'],
      description: 'test',
    })
  }

  async run (msg: CommandMessage, args: any[]): Promise<Message | Message[]> {
    const council = Votum.getCouncil(msg.channel.id)

    return msg.reply('Yes')
  }
}
