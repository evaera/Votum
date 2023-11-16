import { PieceContext } from "@sapphire/framework"
import { Message } from "discord.js"
import ICommand from "../ICommand"

export default class SetWeightCommand extends ICommand {
  constructor(client: PieceContext) {
    super(client, {
      name: "setweight",
      aliases: ["setweights", "voteweight", "voteweights"],
      adminOnly: true,
      description: "Set the vote weight of a specific councilor in this council.",
    })
  }

  async execute(msg: Message, args: any): Promise<Message | Message[]> {
    let argsTarget = await args.next()
    const argsWeight = await args.next() as number
    const weights = this.council.getVoteWeights() || {}

    const maybeRole = await msg.guild?.roles.fetch(argsTarget)
    const maybeUser = maybeRole ? null : await msg.guild?.members.fetch(argsTarget).catch(() => null)
    argsTarget = maybeRole || maybeUser

    if (argsTarget !== null && argsTarget.id !== undefined) {
      if(!(argsWeight === null)) {
        if (argsWeight < 0) {
            return msg.reply("Weight must not be less than zero")
        }
        this.updateWeight(argsTarget.id, argsWeight, weights)
      } else {
          return msg.reply("Weight argument not given")
      }
    } else if(argsTarget == null) {
        return msg.reply("Target could not be found")
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
    return msg.reply((argsTarget.id ? `Set ${argsTarget}'s weight to ${argsWeight}\n` : "Current vote weights:\n") + `\n${lines.join("\n")}`)
  }

  updateWeight(member: any, weight: any, weights: { [index: string]: number }): void {
    if (weight == 1) {
      delete weights[member]
    } else {
      weights[member] = weight
    }

    this.council.setConfig("voteWeights", weights)
  }
}
