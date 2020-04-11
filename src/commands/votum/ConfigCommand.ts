import { Message } from "discord.js"
import { CommandoClient, CommandoMessage } from "discord.js-commando"
import {
  ConfigurableCouncilData,
  ConfigurableCouncilDataSerializers,
  OptionalCouncilData,
} from "../../CouncilData"
import {
  getDefaultValue,
  getProps,
  parseType,
  response,
  ResponseType,
} from "../../Util"
import Command from "../Command"

interface ConfigArguments {
  key: string
  value: string
}

const makeDisplay = (displayer?: (value: any) => string) => (value: any) => {
  if (value === undefined || value === null) {
    return "None"
  } else if (displayer) {
    return displayer(value)
  } else {
    return value.toString()
  }
}

export default class ConfigCommand extends Command {
  constructor(client: CommandoClient) {
    super(client, {
      name: "config",
      aliases: ["votumconfig", "cfg", "vconfig", "vcfg", "councilconfig"],
      description: "Designates a specific role for councilors.",
      adminOnly: true,

      args: [
        {
          key: "key",
          prompt: "Which configuration point would you like to change?",
          type: "string",
          default: "",
        },
        {
          key: "value",
          prompt:
            "What value would you like to set this configuration point to?",
          type: "string",
          default: "",
        },
      ],
    })
  }

  async execute(
    msg: CommandoMessage,
    args: ConfigArguments
  ): Promise<Message | Message[]> {
    if (args.key.length === 0) {
      return msg.reply(
        response(
          ResponseType.Neutral,
          `Available configuration points are:\n${Object.keys(
            getProps(ConfigurableCouncilData)
          )
            .map((n) => `~${n}~`)
            .join(",\n ")}.`
        )
      )
    }

    const key = args.key.replace(/\.([a-z0-9])/g, (_, l) =>
      l.toUpperCase()
    ) as keyof ConfigurableCouncilData

    if (!(key in getProps(ConfigurableCouncilData))) {
      return msg.reply(
        response(
          ResponseType.Bad,
          `:x: \`${key}\` is not a valid configuration point.`
        )
      )
    }

    const serializer = ConfigurableCouncilDataSerializers[key]
    const display = makeDisplay(serializer.display)

    if (args.value.length === 0) {
      return msg.reply(
        response(
          ResponseType.Neutral,
          `Configuration point ${args.key} is currently set to ~${display(
            this.council.getConfig(key)
          )}~.`
        )
      )
    }

    if (args.value === "$remove" && key in getProps(OptionalCouncilData)) {
      this.council.setConfig(key, getDefaultValue(key, OptionalCouncilData))
      return msg.reply(
        response(
          ResponseType.Neutral,
          `Set configuration point ~${key}~ back to default state.`
        )
      )
    }

    const value = await parseType(this.client, msg, args.value, serializer)

    if (value !== null) {
      const serializedValue = serializer.serialize(value)

      this.council.setConfig(key, serializedValue)

      return msg.reply(
        response(
          ResponseType.Good,
          `Set configuration point ~${key}~ to ${display(value)}`
        )
      )
    } else {
      return msg.reply(
        response(
          ResponseType.Bad,
          `~${args.value}~ is not a valid **${serializer.type}**`
        )
      )
    }
  }
}
