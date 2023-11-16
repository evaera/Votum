import { PieceContext } from "@sapphire/framework"
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class YesCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = 1

  constructor (client: PieceContext) {
    super(client, {
      name: 'yes',
      aliases: ['aye', 'si', 'yea', 'yay', 'ja', 'oui', 'da', 'да'],
      description: 'Vote yes on a motion'
    })
  }
}
