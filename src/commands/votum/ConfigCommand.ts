import { Message } from 'discord.js'
import { CommandMessage, CommandoClient } from 'discord.js-commando'
import { ConfigurableCouncilData, ConfigurableCouncilDataSerializers, OptionalCouncilData } from '../../CouncilData'
import { getDefaultValue, getProps, parseType, ResponseType, response } from '../../Util'
import Command from '../Command'

interface ConfigArguments {
  key: keyof ConfigurableCouncilData
  value: string
}

export default class ConfigCommand extends Command {
  constructor (client: CommandoClient) {
    super(client, {
      name: 'config',
      aliases: ['votumconfig', 'cfg', 'vconfig', 'vcfg'],
      description: 'Designates a specific role for councilors.',
      adminOnly: true,

      args: [
        {
          key: 'key',
          prompt: 'Which configuration point would you like to change?',
          type: 'string'
        },
        {
          key: 'value',
          prompt: 'What value would you like to set this configuration point to?',
          type: 'string'
        }
      ]
    })
  }

  async execute (msg: CommandMessage, args: ConfigArguments): Promise<Message | Message[]> {
    const key = args.key.replace(/\.([a-z0-9])/g, (_, l) => l.toUpperCase()) as keyof ConfigurableCouncilData

    if (!(key in getProps(ConfigurableCouncilData))) {
      return msg.reply(`:grey_question: \`${key}\` is not a valid configuration point.`)
    }

    if (
      args.value === '$remove'
      && key in getProps(OptionalCouncilData)
    ) {
      this.council.setConfig(
        key,
        getDefaultValue(key, OptionalCouncilData)
      )
      return msg.reply(response(
        ResponseType.Neutral,
        `Set configuration point ~${key}~ back to default state.`
      ))
    }

    const serializer = ConfigurableCouncilDataSerializers[key]
    const result = await parseType(
      this.client,
      msg,
      args.value,
      serializer
    )

    if ((result.values as object | null) !== null) {
      const value = (result.values as any).value as Object
      const serializedValue = serializer.serialize(value)

      this.council.setConfig(
        key,
        serializedValue
      )

      return msg.reply(response(
        ResponseType.Good,
        `Set configuration point ~${key}~ to ${value.toString()}`
      ))
    } else {
      return msg.reply(response(
        ResponseType.Bad,
        `~${args.value}~ is not a valid **${serializer.type}**`
      ))
    }
  }
}
