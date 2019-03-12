import { ArgumentType, CommandoClient } from 'discord.js-commando'
import actionSchema = require('../schemas/action.json')
import Ajv from 'ajv'

const validateActionSchema = new Ajv().compile(actionSchema)

export = class FinishActionType extends ArgumentType {
  constructor (client: CommandoClient) {
    super(client, 'finish-action')
  }

  validate (input: string) {
    try {
      if (validateActionSchema(JSON.parse(input))) {
        return true
      } else if (validateActionSchema.errors) {
        return validateActionSchema.errors.map(e => `${e.dataPath} ${e.message}`).join('\n')
      }
    } catch (e) {
      return 'Invalid JSON string.'
    }

    return true
  }

  parse (input: string) {
    return JSON.parse(input)
  }
}
