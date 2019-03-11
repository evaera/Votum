import { Snowflake } from 'discord.js'
import { MotionData } from './Motion'
import * as t from 'io-ts'
import { withDefault } from './Util'
import { ArgumentInfo } from 'discord.js-commando'

const OptionalConfigurableCouncilData = t.partial({

})

const OptionalDefaultConfigurableCouncilData = t.type({
  userCooldown: withDefault(t.number, 0),
  motionExpiration: withDefault(t.number, 0)
})

export const OptionalCouncilData = t.intersection([OptionalConfigurableCouncilData, OptionalDefaultConfigurableCouncilData])

export const RequiredConfigurableCouncilData = t.type({

})

export const ConfigurableCouncilData = t.exact(t.intersection([OptionalCouncilData, RequiredConfigurableCouncilData]))

export type ConfigurableCouncilData = t.TypeOf<typeof ConfigurableCouncilData>

interface Serializer<T> extends Partial<ArgumentInfo> {
  serialize (value: any): T
  type: string
}

export const ConfigurableCouncilDataSerializers: {
  [K in keyof ConfigurableCouncilData]: Serializer<
    ConfigurableCouncilData[K]
  >
} = {
  userCooldown: {
    type: 'integer',
    serialize: t.identity
  },
  motionExpiration: {
    type: 'integer',
    serialize: t.identity
  }
}

interface StaticCouncilData {
  enabled: boolean,
  name: string,
  announceChannel?: Snowflake,
  councilorRole?: Snowflake,
  userCooldowns: { [index: string]: number },
  motions: MotionData[]
}

export type CouncilData = StaticCouncilData & ConfigurableCouncilData

const defaultConfigurableData = OptionalDefaultConfigurableCouncilData.decode({})

if (defaultConfigurableData.isLeft()) {
  throw new Error('Invalid default values')
}

export const DefaultCouncilData: CouncilData = {
  enabled: false,
  name: 'Council',
  userCooldowns: {},
  motions: [],
  ...defaultConfigurableData.value
}
