import { Snowflake } from 'discord.js'
import * as t from 'io-ts'
import { MotionResolution, LegacyMotionVoteType } from './Motion'
import { betweenRange, ExtractRight } from './Util'

export interface MotionData {
  authorId: Snowflake
  authorName: string
  active: boolean
  resolution: MotionResolution
  text: string
  voteType?: LegacyMotionVoteType
  createdAt: number
  deletedAt?: number
  didExpire: boolean
  votes: MotionVote[]
  options?: MotionOptions
}

export interface MotionVote {
  authorId: Snowflake,
  authorName: string,
  state?: 1 | 0 | -1,
  name: string,
  reason?: string
}

export const MotionMajorityType = new t.Type(
  'MotionMajorityType',
  t.number.is,
  (i, c) => {
    return t.string.decode(i).chain(str => {
      str = str.trim()

      if (str.endsWith('%')) {
        return t.number.decode(Number(str.substr(0, str.length - 1))).chain(number => {
          if (Number.isNaN(number) || number < 0 || number > 100) {
            return t.failure(i, c, 'Invalid percentage: must be 0-100')
          } else {
            return t.success(number / 100)
          }
        })
      } else if ((str.match(/\//g) || []).length === 1) {
        const operands = str.split('/')

        const ea = operands.map(operand => t.number.decode(Number(operand)))

        if (ea.every(e => e.isRight())) {
          const [dividend, divisor] = ea.map(e => e.value as ExtractRight<typeof e>)

          return t.success(dividend / divisor)
        }
      }

      return t.failure(i, c, 'Must provide majority type as percentage or fraction.')
    })
  },
  t.identity
).pipe(betweenRange(0, 1))

export const MotionOptions = t.exact(t.partial({
  majority: MotionMajorityType
}))
export type MotionOptions = t.TypeOf<typeof MotionOptions>

export interface MotionMetaOptions {
  unanimous?: boolean
}
