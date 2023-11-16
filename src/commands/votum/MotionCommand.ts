import { PieceContext } from "@sapphire/framework"
import { Message } from "discord.js"
import { PathReporter } from "io-ts/lib/PathReporter"
import Motion, { LegacyMotionVoteType, MotionResolution } from "../../Motion"
import { response, ResponseType } from "../../Util"
import ICommand from "../ICommand"

export default class MotionCommand extends ICommand {
  constructor(client: PieceContext) {
    super(client, {
      name: "motion",
      aliases: ["propose", "proposal", "call"],
      description: "Create a motion",

      allowWithConfigurableRoles: ["proposeRole"],
      adminsAlwaysAllowed: true
    })
  }

  async execute(msg: Message): Promise<Message | Message[]> {
    let args = msg.toString().split(" ").slice(1).join(" ")
    await msg.guild?.members.fetch() // Privileged intents fix

    if (!args) {
      return this.executeWithoutArguments(msg);
    }

    if (args === "kill") {
      return this.killMotion(msg);
    }

    if (this.council.currentMotion && !this.council.getConfig("motionQueue")) {
      return msg.reply("There is already an active motion.")
    }

    if (this.council.getConfig("councilorMotionDisable")) {
      return msg.reply("Creating motions is disabled in this council.")
    }

    const proposeRole = this.council.getConfig("proposeRole")
    // @ts-ignore
    if (proposeRole && !msg.member.roles.cache.has(proposeRole)) {
      return msg.reply("You don't have permission to propose motions.")
    }

    if (args.length > 2000) {
      return msg.reply(
        "Your motion is too long. The maximum length is 2000 characters."
      )
    }

    if (this.council.isUserOnCooldown(msg.author.id)) {
      return msg.reply(
        `You must wait ${+(this.council.userCooldown / 3600000).toFixed(
          2
        )} hours between motions. (${+(
          this.council.getUserCooldown(msg.author.id) / 3600000
        ).toFixed(2)} hours left)`
      )
    }

    let voteType = LegacyMotionVoteType.Majority

    const result = Motion.parseMotionOptions(args)

    if (result.isLeft()) {
      return msg.reply({
        embeds: [response(ResponseType.Bad, PathReporter.report(result).join("\n")).embed],
      })
    }

    const [text, options] = result.value

    if (
      options.majority &&
      options.majority < this.council.getConfig("majorityMinimum")
    ) {
      return msg.reply({
        embeds: [response(
          ResponseType.Bad,
          `The given majority type is disallowed by the ~majority.minimum~ configuration point. Please specify a higher majority.`
        ).embed]
      })
    }

    const motionAlreadyExists = this.council.currentMotion

    if (this.council.getConfig("userCooldownKill")) {
      this.council.setUserCooldown(msg.author.id, Date.now())
    }

    const motion = this.council.createMotion({
      text,
      authorId: msg.author.id,
      // @ts-ignore
      authorName: msg.member.displayName,
      createdAt: Date.now(),
      voteType,
      active: true,
      resolution: MotionResolution.Unresolved,
      didExpire: false,
      votes: [],
      options,
    })

    if (motionAlreadyExists) {
      return msg.reply({
        embeds: [response(
          ResponseType.Good,
          "Your motion has been queued and will begin after the current motion."
        ).embed]
      })
    }

    return motion.postMessage(true)
  }

  executeWithoutArguments(msg: Message): Promise<Message | Message[]> {
    if (this.council.currentMotion) {
      return this.council.currentMotion.postMessage()
    } else {
      return msg.reply(
        "There is no active motion. Run `!motion <text>` to start one."
      )
    }
  }

  killMotion(msg: Message): Promise<Message | Message[]> {
    if (this.council.currentMotion) {
      if (
        this.council.currentMotion.authorId === msg.author.id ||
        // @ts-ignore
        msg.member.hasPermission("MANAGE_GUILD") ||
        // @ts-ignore
        !!msg.member.roles.cache.find((role) => role.name === "Votum Admin")
      ) {
        const motion = this.council.currentMotion
        motion.resolve(MotionResolution.Killed)
        return motion.postMessage()
      } else {
        return msg.reply("You don't have permission to kill this motion.")
      }
    }

    return msg.reply("There is no motion active.")
  }
}
