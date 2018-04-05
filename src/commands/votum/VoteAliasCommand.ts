import { CommandMessage } from 'discord.js-commando'
import { Message } from 'discord.js'
import Command from '../Command'
import { CastVoteStatus } from '../../Motion'
import Votum from '../../Votum';

export default class VoteAliasCommand extends Command {
  protected state: 1 | 0 | -1

  private getVoteName (msg: CommandMessage) {
    let name = msg.command.name

    if (msg.cleanContent.substring(0, 1) === Votum.bot.commandPrefix) {
      name = msg.cleanContent.split(' ')[0].slice(1)
    }

    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }

  async execute (msg: CommandMessage, args: any): Promise<Message | Message[]> {
    if (this.council.currentMotion == null) {
      return msg.reply('There is no motion active.')
    }

    if (msg.command.name !== 'abstain' && !args.reason) {
      return msg.reply('You must provide a reason with your vote.')
    }

    const motion = this.council.currentMotion

    const voteStatus = motion.castVote({
      authorId: msg.author.id,
      authorName: msg.member.displayName,
      name: this.getVoteName(msg),
      state: this.state,
      reason: args.reason
    })

    switch (voteStatus) {
      case CastVoteStatus.New:
        return motion.postMessage()
      case CastVoteStatus.Changed:
        return motion.postMessage(`${msg.member} changed their vote to ${this.getVoteName(msg)}.`)
      case CastVoteStatus.Failed:
        return msg.reply("You can't vote on this motion.")
    }
  }
}
