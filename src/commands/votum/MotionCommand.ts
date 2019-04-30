import { CommandoClient, CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'
import Motion, { LegacyMotionVoteType, MotionResolution } from '../../Motion'
import { response, ResponseType } from '../../Util'
import { PathReporter } from 'io-ts/lib/PathReporter'

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
        if (this.council.currentMotion.authorId === msg.author.id || (msg.member.hasPermission('MANAGE_GUILD') || !!msg.member.roles.find('name', 'Votum Admin'))) {
          const motion = this.council.currentMotion
          motion.resolve(MotionResolution.Killed)
          return motion.postMessage()
        } else {
          return msg.reply("You don't have permission to kill this motion.")
        }
      }

      if (!this.council.getConfig('motionQueue')) {
        return msg.reply('There is already an active motion.')
      }
    }

    if (args.text === 'kill') {
      return msg.reply('There is no motion active.')
    }

    if (this.council.getConfig('councilorMotionDisable')) {
      return msg.reply('Creating motions is disabled in this council.')
    }

    const proposeRole = this.council.getConfig('proposeRole')
    if (proposeRole && !msg.member.roles.has(proposeRole)) {
      return msg.reply("You don't have permission to propose motions.")
    }

    if (args.text.length > 2000) {
      return msg.reply('Your motion is too long. The maximum length is 2000 characters.')
    }

    if (this.council.isUserOnCooldown(msg.author.id)) {
      return msg.reply(`You must wait ${+(this.council.userCooldown / 3600000).toFixed(2)} hours between motions. (${+(this.council.getUserCooldown(msg.author.id) / 3600000).toFixed(2)} hours left)`)
    }

    let voteType = LegacyMotionVoteType.Majority

    const result = Motion.parseMotionOptions(args.text)

    if (result.isLeft()) {
      return msg.reply(response(
        ResponseType.Bad,
        PathReporter.report(result).join('\n')
      ))
    }

    const [text, options] = result.value

    if (options.majority && options.majority < this.council.getConfig('majorityMinimum')) {
      return msg.reply(response(
        ResponseType.Bad,
        `The given majority type is disallowed by the ~majority.minimum~ configuration point. Please specify a higher majority.`
      ))
    }

    const motionAlreadyExists = this.council.currentMotion

    if (this.council.getConfig('userCooldownKill')) {
      this.council.setUserCooldown(msg.author.id, Date.now())
    }

    const motion = this.council.createMotion({
      text,
      authorId: msg.author.id,
      authorName: msg.member.displayName,
      createdAt: Date.now(),
      voteType,
      active: true,
      resolution: MotionResolution.Unresolved,
      didExpire: false,
      votes: [],
      options
    })

    if (motionAlreadyExists) {
      return msg.reply(response(
        ResponseType.Good,
        'Your motion has been queued and will begin after the current motion.'
      ))
    }

    return motion.postMessage(true)
  }
}
