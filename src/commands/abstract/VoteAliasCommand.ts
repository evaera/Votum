import { CouncilData } from "../../CouncilData"
import { CastVoteStatus } from "../../Motion"
import ICommand from "../ICommand"
import { Message } from "discord.js"
import { container } from "@sapphire/framework"

const reasonRequiredMap: { [index: string]: keyof CouncilData } = {
  abstain: "reasonRequiredAbstain",
  yes: "reasonRequiredYes",
  no: "reasonRequiredNo",
}

export default class VoteAliasCommand extends ICommand {
  protected state: 1 | 0 | -1

  async execute(msg: Message): Promise<Message | Message[]> {
    let args = msg.toString().split(" ").slice(1).join(" ")

    if (!this.council.currentMotion) {
      return msg.reply("There is no motion active.")
    }

    if (
      !args &&
      this.council.getConfig(reasonRequiredMap[this.name])
    ) {
      return msg.reply("You must provide a reason with your vote.")
    }

    if (args.length > 1000) {
      return msg.reply(
        "Your reason is too long. The maximum length is 1000 characters.",
      )
    }

    const motion = this.council.currentMotion

    const voteStatus = motion.castVote({
      authorId: msg.author.id,
      // @ts-ignore
      authorName: msg.member.displayName,
      name: this.getVoteName(msg),
      state: this.state,
      reason: args,
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
          `${msg.member} changed their vote to ${this.getVoteName(msg)}.`,
        )
      case CastVoteStatus.Failed:
        return msg.reply("You can't vote on this motion.")
    }
  }

  private getVoteName(msg: Message) {
    let name = msg.toString().split(" ").slice(0, 1).join()

    if (msg.cleanContent.startsWith(<string>container.client.fetchPrefix(msg))) {
      name = msg.cleanContent.split(" ")[0].slice(1)
    }

    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
}
