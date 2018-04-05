import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'
import { MotionVoteType, MotionResolution } from '../../Motion'

export default class MotionCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'motion',
      aliases: ['propose', 'proposal', 'call'],
      description: 'Create a motion',

      args: [
        {
          key: 'text',
          prompt: 'The text of the motion to propose.',
          type: 'string',
          default: ''
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (!args.text) {
      if (this.council.currentMotion) {
        return this.council.currentMotion.postMessage()
      } else {
        return msg.reply('There is no active motion. Run `!motion <text>` to start one.')
      }
    }

    if (this.council.currentMotion) {
      if (args.text === 'kill') {
        if (this.council.currentMotion.author === msg.author.id || (msg.member.hasPermission('MANAGE_GUILD') || !!msg.member.roles.find('name', 'Votum Admin'))) {
          const motion = this.council.currentMotion
          motion.resolve(MotionResolution.Killed)
          return motion.postMessage()
        } else {
          return msg.reply("You don't have permission to kill this motion.")
        }
      }

      return msg.reply('There is already an active motion.')
    }

    if (this.council.isUserOnCooldown(msg.author.id)) {
      return msg.reply(`You must wait ${+(this.council.userCooldown / 3600000).toFixed(2)} hours between motions. (${+(this.council.getUserCooldown(msg.author.id) / 3600000).toFixed(2)} hours left)`)
    }

    let text: string[] = args.text.split(' ')
    let voteType = MotionVoteType.Majority

    if (text[0] === '-u') {
      text.shift()
      voteType = MotionVoteType.Unanimous
    }

    const motion = this.council.createMotion({
      text: text.join(' '),
      authorId: msg.author.id,
      authorName: msg.member.displayName,
      createdAt: Date.now(),
      voteType,
      active: true,
      resolution: MotionResolution.Unresolved,
      didExpire: false,
      votes: []
    })

    return motion.postMessage(true)
  }
}
