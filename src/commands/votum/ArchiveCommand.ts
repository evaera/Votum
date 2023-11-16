import { PieceContext } from "@sapphire/framework"
import { Message, TextChannel } from "discord.js"
import { MotionResolution } from "../../Motion"
import Command from "../ICommand"

const removeFormatting = (text: string) =>
  text.replace(/(\*|_|~|\n)/g, "").replace(/(<@.*?>)/g, "")

export default class ArchiveCommand extends Command {
  constructor(client: PieceContext) {
    super(client, {
      name: "archive",
      description: "Allows you to view the council archive.",
    })
  }

  async execute(msg: Message): Promise<Message | Message[]> {
    let args = msg.toString().split(" ").slice(1).join(" ")
    let raw = args as string

    if (raw.trim() === "export") {
      await msg.reply("Here's your council's data:")
      return msg.reply({
        files: [
          {
            name: `${this.council.name}-${new Date().toISOString()}.json`,
            attachment: Buffer.from(this.council.exportData()),
          },
        ],
      })
    }

    raw = raw.replace(/#/g, "")

    if (raw.length === 0) {
      return msg.reply(
        "The archive command allows you to view past motions in your council. To browse a range of motions, use `!archive #5-#15`. To view a single motion, use `!archive #6`.\n\nThe most recent motion in this council is #" +
        this.council.numMotions +
        "."
      )
    }

    const range = []

    for (const text of raw.split("-")) {
      const n = parseInt(text, 10)
      if (isNaN(n)) {
        return msg.reply(`\`${text}\` is not a number.`)
      }
      range.push(this.clampRange(n))
    }

    if (range.length > 2) {
      return msg.reply(
        "Please only provide a range of two numbers, like `#1-#10`."
      )
    } else if (range.length === 2) {
      if (range[1] <= range[0]) {
        return msg.reply(
          "Second number in range must be greater than the first."
        )
      }

      const summaries = this.buildArchiveResults(range);

      return msg.reply({
        embeds: [{
          title: `Archive Results #${range[0]}-#${range[1]}`,
          description: summaries.join("\n").substring(0, 2000),
          footer: {
            text:
              "To view a full motion, run `!archive #1` where `1` is the number of the motion you want to view.",
          },
          color: 0xfaff72,
        }],
      })
    } else {
      const motion = this.council.getMotion(range[0] - 1)

      return motion.postMessage("", msg.channel as TextChannel)
    }
  }

  clampRange(i: number): number {
    if (i <= 0) {
      return 1;
    } else if (i > this.council.numMotions) {
      return this.council.numMotions;
    }

    return i
  }

  buildArchiveResults(range: number[]): string[] {
    const summaries = []
    for (let i = range[0]; i <= range[1]; i++) {
      const motion = this.council.getMotion(i - 1)
      summaries.push(
        `**#${i}** ${
          MotionResolution[motion.resolution]
        } | ${removeFormatting(motion.text).substring(0, 45)}`
      )

      if (summaries.join("\n").length > 1900) {
        summaries.pop()
        summaries.push(
          "**Remaining results have been truncated, please specify a smaller range.**"
        )
        break
      }
    }
    return summaries;
  }
}
