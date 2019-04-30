import { ArgumentInfo } from 'discord.js-commando'
import * as t from 'io-ts'
import { MotionData, MotionMajorityType } from './MotionData'
import { withDefault, betweenRange } from './Util'

const OptionalConfigurableCouncilData = t.partial({
  councilorRole: t.string,
  proposeRole: t.string,
  announceChannel: t.string,
  userCooldownKill: t.boolean,

  onPassedAnnounce: t.string,
  onKilledAnnounce: t.string,
  onFailedAnnounce: t.string,

  onFinishActions: t.unknown,

  councilorMotionDisable: t.boolean,
  motionQueue: t.boolean,

  majorityDefault: MotionMajorityType,

  reasonRequiredAbstain: t.boolean
})

export interface OnFinishActions {
  failed?: OnFinishAction[]
  killed?: OnFinishAction[]
  passed?: OnFinishAction[]
}

export interface OnFinishAction {
  action: 'forward'
  atMajority?: number
  /**
   * Options string which overrides the existing motion options
   */
  options?: string
  to: string
}

const OptionalDefaultConfigurableCouncilData = t.type({
  userCooldown: withDefault(t.number, 0),
  motionExpiration: withDefault(t.number, 0),

  majorityMinimum: withDefault(betweenRange(0, 1), 0.5),
  majorityReachedEnds: withDefault(t.boolean, true),

  reasonRequiredYes: withDefault(t.boolean, true),
  reasonRequiredNo: withDefault(t.boolean, true)
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
const percentDisplay = (n: number) => n.toLocaleString('en-us', { style: 'percent' })
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
  },
  proposeRole: {
    type: 'role',
    serialize: getId
  },
  announceChannel: {
    type: 'channel',
    serialize: getId
  },
  onPassedAnnounce: {
    type: 'channel',
    serialize: getId
  },
  onFailedAnnounce: {
    type: 'channel',
    serialize: getId
  },
  onKilledAnnounce: {
    type: 'channel',
    serialize: getId
  },
  onFinishActions: {
    type: 'finish-action',
    serialize: t.identity,
    display: x => `~~json\n${JSON.stringify(x, undefined, 1)}~~`
  },
  councilorMotionDisable: {
    type: 'boolean',
    serialize: t.identity
  },
  majorityDefault: {
    type: 'majority-type',
    serialize: t.identity,
    display: percentDisplay
  },
  majorityMinimum: {
    type: 'float',
    serialize: t.identity
  },
  majorityReachedEnds: {
    type: 'boolean',
    serialize: t.identity
  },
  motionQueue: {
    type: 'boolean',
    serialize: t.identity
  },
  userCooldownKill: {
    type: 'boolean',
    serialize: t.identity
  },
  reasonRequiredYes: {
    type: 'boolean',
    serialize: t.identity
  },
  reasonRequiredNo: {
    type: 'boolean',
    serialize: t.identity
  },
  reasonRequiredAbstain: {
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
