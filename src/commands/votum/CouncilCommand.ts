import { PieceContext } from "@sapphire/framework"
import { Message } from "discord.js"
import ICommand from "../ICommand"

export class CouncilCommand extends ICommand {
  public constructor(client: PieceContext) {
    super(client, {
      name: 'council',
      aliases: [],
      description: "Designates the channel this command is run in as a council channel.",
      councilOnly: false,
      adminOnly: true
    });
  }

  async execute(msg: Message): Promise<Message | Message[]> {
    let args = msg.toString().split(" ").slice(1).join(" ")
    if (args === "remove") {
      if (this.council.enabled) {
        this.council.enabled = false
        return msg.reply(
          `Removed council "${this.council.name}". (Note: Settings are still saved if you ever enable a council in this channel again.)`
        )
      } else {
        return msg.reply("There is no council enabled in this channel.")
      }
    } else {
      if (args == "") args = "Council";
      if (this.council.enabled) {
        if (this.council.name !== args) {
          this.council.name = args
          return msg.reply(`Changed this council's name to "${args}"`)
        } else {
          return msg.reply(`This council already exists.`)
        }
      } else {
        this.council.enabled = true
        this.council.name = args
        return msg.reply(`Created council "${args}"`)
      }
    }
  }
}
