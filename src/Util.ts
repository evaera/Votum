import { ArgumentCollector, CommandMessage, CommandoClient, ArgumentInfo } from 'discord.js-commando'
import * as t from 'io-ts'

export function withDefault<T extends t.Any> (type: T, defaultValue: t.TypeOf<T>): t.Type<t.TypeOf<T>, t.TypeOf<T>> {
  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(defaultValue)})`,
    type.is,
    (v, c) => type.validate(v != null ? v : defaultValue, c),
    type.encode
  )
}

export function inProps (name: string, type: t.IntersectionType<Array<t.InterfaceType<t.AnyProps>>>) {
  return name in getProps(type)
}

export function getProps (codec: t.HasProps | t.ExactType<t.HasProps>): t.Props {
  switch (codec._tag) {
    case 'ExactType':
      return getProps(codec.type)
    case 'RefinementType':
    case 'ReadonlyType':
      return getProps(codec.type)
    case 'InterfaceType':
    case 'StrictType':
    case 'PartialType':
      return codec.props
    case 'IntersectionType':
      return codec.types.reduce<t.Props>((props, type) => Object.assign(props, getProps(type)), {})
  }
}

export function getDefaultValue (name: string, type: t.HasProps | t.ExactType<t.HasProps>) {
  return getProps(type)[name].decode(undefined).getOrElse(undefined)
}

export function parseType (
  client: CommandoClient,
  message: CommandMessage,
  value: string,
  info: Partial<ArgumentInfo>
) {
  const collector = new ArgumentCollector(client, [Object.assign({
    key: 'value',
    prompt: 'value'
  }, info)])

  return collector.obtain(message, [value], 0)
}

export enum ResponseType {
  Good = 0x2ecc71,
  Bad = 0xe74c3c,
  Neutral = 0xe67e22
}
export function response (color: number, description: string, {
  title
}: {
  title?: string
} = {}) {
  return {
    embed: {
      description: description.replace(/~/g, '`'),
      title,
      color
    }
  }
}
