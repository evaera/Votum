import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message, TextChannel } from 'discord.js'
import Command from '../Command'

export default class MotionAnnounceChannelCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'motionannouncechannel',
      description: 'Designates a specific channel where announcements of all passing motions will be posted.',
      adminOnly: true,

      args: [
        {
          key: 'channel',
          prompt: 'The channel to use for announcements.',
          type: 'channel|string'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (args.channel === 'remove') {
      this.council.councilorRole = undefined
      return msg.reply(`Removed the announcement channel for "${this.council.name}"`)
    }

    if (args.channel instanceof TextChannel) {
      this.council.announceChannel = args.channel.id
      return msg.reply(`Set the announcement channel for "${this.council.name}" to ${args.channel}`)
    }

    return msg.reply('Invalid command usage: Please specify a channel')
  }
}
