import { ArgumentType, CommandoClient } from 'discord.js-commando'
import { MotionMajorityType } from '../MotionData'
import { PathReporter } from 'io-ts/lib/PathReporter'

export = class MajorityType extends ArgumentType {
  constructor (client: CommandoClient) {
    super(client, 'majority-type')
  }

  validate (input: string) {
    const ea = MotionMajorityType.decode(input)
    return ea.isRight() || PathReporter.report(ea).join('\n')
  }

  parse (input: string) {
    const ea = MotionMajorityType.decode(input)
    return ea.getOrElseL(e => {
      throw e
    })
  }
}
