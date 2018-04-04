import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'

export default class CouncilCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'council',
      description: 'Designates the channel this command is run in as a council channel.',
      councilOnly: false,
      adminOnly: true,

      args: [
        {
          key: 'name',
          prompt: 'The name of this council, or "remove" to remove.',
          type: 'string',
          default: 'Council'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (args.name === 'remove') {
      if (this.council.enabled) {
        this.council.enabled = false
        return msg.reply(`Removed council "${this.council.name}". (Note: Settings are still saved if you ever enable a council in this channel again.)`)
      } else {
        return msg.reply('There is no council enabled in this channel.')
      }
    }

    if (this.council.enabled) {
      if (this.council.name !== args.name) {
        this.council.name = args.name
        return msg.reply(`Changed this council's name to "${args.name}"`)
      } else {
        return msg.reply(`This council already exists.`)
      }
    } else {
      this.council.enabled = true
      this.council.name = args.name

      return msg.reply(`Created council "${args.name}"`)
    }
  }
}
