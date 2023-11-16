import { Message } from "discord.js"
import { Args, PieceContext } from "@sapphire/framework"
import { ConfigurableCouncilData, ConfigurableCouncilDataSerializers, OptionalCouncilData } from "../../CouncilData"
import { getDefaultValue, getProps, response, ResponseType } from "../../Util"
import ICommand from "../ICommand"

const makeDisplay = (displayer?: (value: any) => string) => (value: any) => {
  if (value === undefined || value === null) {
    return "None"
  } else if (displayer) {
    return displayer(value)
  } else {
    return value.toString()
  }
}

export default class ConfigCommand extends ICommand {
  constructor(client: PieceContext) {
    super(client, {
      name: "config",
      aliases: ["votumconfig", "cfg", "vconfig", "vcfg", "councilconfig"],
      description: "Designates a specific role for councilors.",
      adminOnly: true,
      quotes: []
    })
  }

  async execute(msg: Message, args: Args): Promise<Message | Message[]> {
    const argsKey = args.next();
    args.save()
    const argsValue = args.next();
    let value

    if (argsKey == null || argsKey.length === 0) {
      return msg.reply({
        embeds: [response(
          ResponseType.Neutral,
          `Available configuration points are:\n${Object.keys(
            getProps(ConfigurableCouncilData),
          )
            .map((n) => `~${n}~`)
            .join(",\n ")}.`,
        ).embed],
      })
    }

    const key = argsKey.replace(/\.([a-z0-9])/g, (_, l) =>
      l.toUpperCase(),
    ) as keyof ConfigurableCouncilData

    if (!(key in getProps(ConfigurableCouncilData))) {
      return msg.reply({
        embeds: [response(
          ResponseType.Bad,
          `:x: \`${key}\` is not a valid configuration point.`,
        ).embed],
      })
    }

    const serializer = ConfigurableCouncilDataSerializers[key]
    const display = makeDisplay(serializer.display)

    if (argsValue == null || argsValue.length === 0) {
      return msg.reply({
        embeds: [response(
          ResponseType.Neutral,
          `Configuration point ${argsKey} is currently set to ${display(
            this.council.getConfig(key),
          )}`,
        ).embed],
      })
    }

    if (argsValue === "$remove" && key in getProps(OptionalCouncilData)) {
      this.council.setConfig(key, getDefaultValue(key, OptionalCouncilData))
      return msg.reply({
        embeds: [response(
          ResponseType.Neutral,
          `Set configuration point ~${key}~ back to default state.`,
        ).embed],
      })
    }

    const valueType = (serializer.type as any)
    try {
      args.restore()
      value = await args.rest(valueType)
    } catch (e) {
      value = null
    }


    if (value !== null) {
      const serializedValue = serializer.serialize(value)

      this.council.setConfig(key, serializedValue)

      return msg.reply({
        embeds: [response(
          ResponseType.Good,
          `Set configuration point ~${key}~ to ${display(value)}`,
        ).embed],
      })
    } else {
      return msg.reply({
        embeds: [response(
          ResponseType.Bad,
          `~${argsValue}~ is not a valid **${serializer.type}**`,
        ).embed],
      })
    }
  }
}
