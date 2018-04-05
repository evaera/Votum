import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, Role } from 'discord.js'
import Command from '../Command'

export default class CouncilorRoleCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'councilorrole',
      description: 'Designates a specific role for councilors.',
      adminOnly: true,

      args: [
        {
          key: 'role',
          prompt: 'The role to use for councilors.',
          type: 'role|string'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (args.role === 'remove') {
      this.council.councilorRole = undefined
      return msg.reply(`Removed the councilor role for "${this.council.name}"`)
    }

    if (args.role instanceof Role) {
      this.council.councilorRole = args.role.id
      return msg.reply(`Set the councilor role for "${this.council.name}" to ${args.role}`)
    }

    return msg.reply('Invalid command usage: Please specify a role')
  }
}
