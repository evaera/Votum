import { Message } from "discord.js"
import { CommandoMessage } from "discord.js-commando"
import { CouncilData } from "../../CouncilData"
import { CastVoteStatus } from "../../Motion"
import Votum from "../../Votum"
import Command from "../Command"

const reasonRequiredMap: { [index: string]: keyof CouncilData } = {
  abstain: "reasonRequiredAbstain",
  yes: "reasonRequiredYes",
  no: "reasonRequiredNo",
}

export default class VoteAliasCommand extends Command {
  protected state: 1 | 0 | -1

  async execute(msg: CommandoMessage, args: any): Promise<Message | Message[]> {
    if (!this.council.currentMotion) {
      return msg.reply("There is no motion active.")
    }

    if (
      !args.reason &&
      // @ts-ignore
      this.council.getConfig(reasonRequiredMap[msg.command.name])
    ) {
      return msg.reply("You must provide a reason with your vote.")
    }

    if (args.reason.length > 1000) {
      return msg.reply(
        "Your reason is too long. The maximum length is 1000 characters."
      )
    }

    const motion = this.council.currentMotion

    const voteStatus = motion.castVote({
      authorId: msg.author.id,
      // @ts-ignore
      authorName: msg.member.displayName,
      name: this.getVoteName(msg),
      state: this.state,
      reason: args.reason,
      isDictator: this.council.getConfig("dictatorRole")
        ? // @ts-ignore
          msg.member.roles.cache.has(this.council.getConfig("dictatorRole")!)
        : false,
    })

    switch (voteStatus) {
      case CastVoteStatus.New:
        return motion.postMessage()
      case CastVoteStatus.Changed:
        return motion.postMessage(
          `${msg.member} changed their vote to ${this.getVoteName(msg)}.`
        )
      case CastVoteStatus.Failed:
        return msg.reply("You can't vote on this motion.")
    }
  }

  private getVoteName(msg: CommandoMessage) {
    // @ts-ignore
    let name = msg.command.name

    if (msg.cleanContent.substring(0, 1) === Votum.bot.commandPrefix) {
      name = msg.cleanContent.split(" ")[0].slice(1)
    }

    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
}
