import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'

export default class MotionExpireCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'motionexpire',
      aliases: ['motionexpiration'],
      description: 'Set the number of hours a motion will last before expiring.',
      adminOnly: true,

      args: [
        {
          key: 'cooldown',
          prompt: 'The number of hours a motion can be active',
          type: 'float'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    this.council.motionExpiration = args.cooldown * 3600000

    return msg.reply(`Set motion expiration for "${this.council.name}" to ${args.cooldown} hours.`)
  }
}
