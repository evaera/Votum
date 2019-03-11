import { ArgumentInfo } from 'discord.js-commando';
import * as t from 'io-ts';
import { MotionData } from './Motion';
import { withDefault } from './Util';

const OptionalConfigurableCouncilData = t.partial({
  councilorRole: t.string
  councilorMotionDisable: t.boolean
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
  transform? (value: any): any
  display? (value: any): any
  type: string
}

const hoursTransformSerialize = (n: number) => n * 3600000
const hoursTransformDisplay = (n: number) => n / 3600000
const getId = (e: { id: string }) => e.id
export const ConfigurableCouncilDataSerializers: {
  [K in keyof Required<ConfigurableCouncilData>]: Serializer<
    ConfigurableCouncilData[K]
  >
} = {
  userCooldown: {
    type: 'integer',
    serialize: t.identity,
    transform: hoursTransformSerialize,
    display: hoursTransformDisplay
  },
  motionExpiration: {
    type: 'integer',
    serialize: t.identity,
    transform: hoursTransformSerialize,
    display: hoursTransformDisplay
  },
  councilorRole: {
    type: 'role',
    serialize: getId
  councilorMotionDisable: {
    type: 'boolean',
    serialize: t.identity
  }
}

interface StaticCouncilData {
  enabled: boolean,
  name: string,
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
