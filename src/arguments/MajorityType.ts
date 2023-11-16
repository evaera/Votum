import { Argument } from "@sapphire/framework"
import { MotionMajorityType } from "../MotionData"
import { PathReporter } from "io-ts/lib/PathReporter"
import { response, ResponseType } from "../Util"

export class MajorityTypeArgument extends Argument {
  run(parameter: string, context: Argument.Context) {
    const ea = MotionMajorityType.decode(parameter)
    if (ea.isRight()) {
      return this.ok(parameter)
    }
    const errors = PathReporter.report(ea).join("\n")
    context.message.reply({ embeds: [response(ResponseType.Bad, `${errors}`).embed]})
    return this.error({
      context,
      parameter,
      message: errors,
    })
  }
}
declare module "@sapphire/framework" {
  interface ArgType {
    MajorityType: never
  }
}
