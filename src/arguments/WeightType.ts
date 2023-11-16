import { Argument } from "@sapphire/framework"
import Ajv from "ajv"
import actionSchema = require("../schemas/weights.json")
import { response, ResponseType } from "../Util"

const validateActionSchema = new Ajv().compile(actionSchema)

export class WeightsTypeArgument extends Argument {
  run(parameter: string, context: Argument.Context) {
    try {
      if (validateActionSchema(JSON.parse(parameter))) {
        return this.ok(JSON.parse(parameter))
      } else if (validateActionSchema.errors) {
        const errors = validateActionSchema.errors.map(e => `${e.dataPath} ${e.message}`).join("\n")
        context.message.reply({ embeds: [response(ResponseType.Bad, `${errors}`).embed]})
        return this.error({
          context,
          parameter,
          message: errors,
        })
      }
    } catch (e) {
      context.message.reply({ embeds: [response(ResponseType.Bad, `Invalid JSON string`).embed]})
      return this.error({
        context,
        parameter,
        message: "Invalid JSON string",
        identifier: "InvalidJSONString",
      })
    }
    return this.ok(JSON.parse(parameter))
  }
}
declare module "@sapphire/framework" {
  interface ArgType {
    WeightType: never
  }
}
