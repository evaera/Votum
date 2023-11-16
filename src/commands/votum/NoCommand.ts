import { PieceContext } from "@sapphire/framework"
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class NoCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = -1

  constructor (client: PieceContext) {
    super(client, {
      name: 'no',
      aliases: ['nay', 'negative', 'nope', 'nein', 'ne', 'не'],
      description: 'Vote no on a motion'
    })
  }
}
