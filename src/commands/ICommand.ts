import { Message, PermissionsBitField } from "discord.js"
import { Command, CommandOptions, PieceContext } from "@sapphire/framework"
import Council from "../Council"
import { CouncilData } from "../CouncilData"
import Votum from "../Votum"

interface CustomCommandInfo {
  name: string
  aliases?: string[]
  description: string
  councilOnly?: boolean
  adminOnly?: boolean
  adminsAlwaysAllowed?: boolean
  allowWithConfigurableRoles?: Array<keyof CouncilData>
  quotes?: Array<string[]>
}

export default class ICommand extends Command {
  public councilOnly: boolean
  public adminOnly: boolean
  public adminsAlwaysAllowed: boolean
  protected council: Council
  private customInfo: CustomCommandInfo

  constructor(client: PieceContext, customInfo: CustomCommandInfo) {
    const info = customInfo as CommandOptions

    super(client, info);

    this.customInfo = customInfo

    this.councilOnly =
      typeof customInfo.councilOnly === "undefined"
        ? true
        : customInfo.councilOnly
    this.adminOnly =
      typeof customInfo.adminOnly === "undefined" ? false : customInfo.adminOnly

    this.adminsAlwaysAllowed = !!customInfo.adminsAlwaysAllowed
  }

  public hasPermission(msg: Message): boolean {
    const council = Votum.getCouncil(msg.channel.id)

    if (msg.author.id === process.env.OWNER) {
      return true
    }

    const isAdmin =
      msg.member?.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
      !!msg.member?.roles.cache.find((role) => role.name === "Votum Admin")

    if (this.adminOnly) {
      return isAdmin
    } else if (isAdmin && this.adminsAlwaysAllowed) {
      return true
    } else if (
      council &&
      this.customInfo.allowWithConfigurableRoles &&
      this.customInfo.allowWithConfigurableRoles.find(
        (configName) =>
          council.getConfig(configName) &&
          msg.member?.roles.cache.has(council.getConfig(configName) as string)
      )
    ) {
      return true
    } else if (council.councilorRole != null) {
      // @ts-ignore
      return msg.member.roles.cache.has(council.councilorRole)
    }
    return true
  }

  public async execute(msg: Message, args?: any): Promise<Message | Message[] | undefined> {
    return msg.reply("This command has no implementation.")
  }

  public async messageRun(msg: Message, args: any): Promise<Message | Message[]> {
    if (this.hasPermission(msg)) {
      try {
        this.council = Votum.getCouncil(msg.channel.id)
        await this.council.initialize()
        const reply = this.execute(msg, args)

        if (reply == null) {
          return msg.reply("Command executed.")
        }

        return reply as Promise<Message | Message[]>
      } catch (e) {
        console.error(e)
        return msg.reply("Sorry, an error occurred executing the command.")
      }
    } else {
      return msg.reply(`You do not have permission to use the \`${this.name}\` command.`)
    }
  }
}
