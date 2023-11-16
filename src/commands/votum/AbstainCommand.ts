import { PieceContext } from "@sapphire/framework"
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class AbstainCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = 0

  constructor (client: PieceContext) {
    super(client, {
      name: 'abstain',
      aliases: ['abs', 'sitout', 'sit-out'],
      description: 'Abstain on a motion',
    })
  }
}
