import { PieceContext } from "@sapphire/framework"
import { Message } from "discord.js"
import ICommand from "../ICommand"
import { MAX_MESSAGE_SIZE } from "../../Util"

export default class PingInactiveCommand extends ICommand {
  constructor(client: PieceContext) {
    super(client, {
      name: "pinginactive",
      aliases: ["pingremaining", "mentionremaining", "alertothers", "lazyvoters"],
      description:
        "Mention the remaining councilmembers who haven't voted yet.",
      adminsAlwaysAllowed: true
    })
  }

  async execute(msg: Message): Promise<Message | Message[]> {
    if (this.council.currentMotion == null) {
      return msg.reply("There is no motion active.")
    }

    const messageReply = "These councilors still need to vote:\n\n"
    const remainingVoters = Array.from(this.council.currentMotion.getRemainingVoters().values()).join(" ");
    const messageTotalLength = messageReply.length + remainingVoters.length

    if (messageTotalLength > MAX_MESSAGE_SIZE) {
      let remainingVotersNotSent = remainingVoters
      let firstIteration = true

      do {
        const maxRemainingVotersMsgSize = firstIteration ? (MAX_MESSAGE_SIZE - messageReply.length) : MAX_MESSAGE_SIZE
        const lastVoterSeparatorIndex = remainingVotersNotSent.substring(0, maxRemainingVotersMsgSize).lastIndexOf(" ")
        const votersMessageContent = remainingVotersNotSent.substring(0, lastVoterSeparatorIndex)
        if (firstIteration) {
          firstIteration = false
          await msg.reply(messageReply + votersMessageContent)
        } else {
          await msg.channel.send(votersMessageContent)
        }

        remainingVotersNotSent = remainingVotersNotSent.substring(lastVoterSeparatorIndex + 1, remainingVotersNotSent.length)
      } while (remainingVotersNotSent.length > MAX_MESSAGE_SIZE)

      return msg.channel.send(remainingVotersNotSent)
    } else {
      return msg.reply(messageReply + remainingVoters)
    }
  }
}
