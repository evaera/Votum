import Ajv from "ajv"
import { ArgumentType, CommandoClient } from "discord.js-commando"
import actionSchema = require("../schemas/weights.json")

const validateActionSchema = new Ajv().compile(actionSchema)

export = class WeightsType extends ArgumentType {
  constructor(client: CommandoClient) {
    super(client, "weights")
  }

  validate(input: string) {
    try {
      if (validateActionSchema(JSON.parse(input))) {
        return true
      } else if (validateActionSchema.errors) {
        return validateActionSchema.errors
          .map(e => `${e.dataPath} ${e.message}`)
          .join("\n")
      }
    } catch (e) {
      return "Invalid JSON string."
    }

    return true
  }

  parse(input: string) {
    return JSON.parse(input)
  }
}
