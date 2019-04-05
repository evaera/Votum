import { ArgumentCollector, CommandMessage, CommandoClient, ArgumentInfo } from 'discord.js-commando'
import * as t from 'io-ts'
import { Either } from 'fp-ts/lib/Either'
import Motion, { MotionResolution } from './Motion'
import Votum from './Votum'

export type ExtractRight<T> = T extends Either<infer L, infer R> ? R : never

export function withDefault<T extends t.Any> (type: T, defaultValue: t.TypeOf<T>): t.Type<t.TypeOf<T>, t.TypeOf<T>> {
  return new t.Type(
    `withDefault(${type.name}, ${JSON.stringify(defaultValue)})`,
    type.is,
    (v, c) => type.validate(v != null ? v : defaultValue, c),
    type.encode
  )
}

export function betweenRange (min: number, max: number) {
  return new t.Type(
    `range(${min}, ${max})`,
    t.number.is,
    (u, c) =>
      t.number.validate(u, c).chain(s =>
        s >= min && s <= max ? t.success(s) : t.failure(u, c)
      ),
    t.identity
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

export async function parseType (
  client: CommandoClient,
  message: CommandMessage,
  value: string,
  info: Partial<ArgumentInfo> & { transform? (value: any): any }
) {
  const collector = new ArgumentCollector(client, [{
    key: 'value',
    prompt: 'value',
    ...info
  }])

  const result = await collector.obtain(message, [value], 5)

  if ((result.values as object | null) === null) {
    return null
  }

  let parsedValue = (result.values as any).value as unknown

  if (info.transform) {
    parsedValue = info.transform(parsedValue)
  }

  return parsedValue as Object
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

export async function forwardMotion (motion: Motion, targetCouncilId: string, optionsString?: string) {
  const targetCouncil = Votum.getCouncil(targetCouncilId)

  if (!targetCouncil.enabled) {
    return
  }

  const motionData = JSON.parse(JSON.stringify(motion.getData()))

  if (optionsString) {
    const ea = Motion.parseMotionOptions(optionsString)

    if (ea.isRight()) {
      const [, options] = ea.value

      motionData.options = {
        ...motionData.options,
        ...options
      }
    }
  }

  motionData.votes.forEach((vote: any) => {
    vote.state = undefined
    vote.authorId = '0',
    vote.authorName = `»${vote.authorName}`
  })
  motionData.resolution = MotionResolution.Unresolved
  motionData.active = true
  motionData.didExpire = false
  motionData.createdAt = Date.now()

  const existingMotion = targetCouncil.currentMotion
  const newMotion = targetCouncil.createMotion(motionData)

  if (!existingMotion) {
    await newMotion.postMessage(true)
  }
}
