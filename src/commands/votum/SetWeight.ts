import { Message } from "discord.js"
import { CommandoClient, CommandoMessage } from "discord.js-commando"
import Command from "../Command"

export default class SetWeightCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: "setweight",
      aliases: ["voteweights"],
      adminOnly: true,
      description:
        "Set the vote weight of a specific councilor in this council.",

      args: [
        {
          key: "target",
          prompt: "The member or role to set the weight of",
          type: "member|role",
          default: "",
        },
        {
          key: "weight",
          prompt: "The weight to set",
          type: "float",
          default: 1,
        },
      ],
    })
  }

  async execute(msg: CommandoMessage, args: any): Promise<Message | Message[]> {
    const weights = this.council.getVoteWeights() || {}

    if (args.target !== "" && typeof args.weight === "number") {
      if (args.weight < 0) {
        return msg.reply("Weight must not be less than zero")
      }

      if (args.weight === 1) {
        delete weights[args.target.id]
      } else {
        weights[args.target.id] = args.weight
      }

      this.council.setConfig("voteWeights", weights)
    }

    const lines = []
    for (const [id, weight] of Object.entries(weights)) {
      // @ts-ignore
      const maybeRole = await msg.guild.roles.fetch(id)
      const maybeUser = maybeRole
        ? null
        : // @ts-ignore
          await msg.guild.members.fetch(id).catch(() => null)

      if (maybeRole) {
        lines.push(`[Role] ${maybeRole.name} : ${weight}`)
      } else if (maybeUser) {
        lines.push(`[User] ${maybeUser.user.tag} : ${weight}`)
      } else {
        lines.push(`[Unknown] ${id} : ${weight}`)
      }
    }

    return msg.reply(
      (args.target ? `Set ${args.target}'s weight to ${args.weight}.\n` : "") +
        `\n${lines.join("\n")}`,
      {
        split: true,
      }
    )
  }
}
