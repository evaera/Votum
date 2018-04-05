import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'

export default class MotionCooldownCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'councilorcooldown',
      aliases: ['motioncooldown'],
      description: 'Set the number of hours a councilor must wait between proposing motions.',
      adminOnly: true,

      args: [
        {
          key: 'cooldown',
          prompt: 'The cooldown to enforce between motions per councilor, in hours.',
          type: 'float'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    this.council.userCooldown = args.cooldown * 3600000

    return msg.reply(`Set motion cooldown per-councilor for "${this.council.name}" to ${args.cooldown} hours.`)
  }
}
