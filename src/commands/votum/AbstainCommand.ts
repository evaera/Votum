import { CommandoClient } from 'discord.js-commando'
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class AbstainCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = 0

  constructor (client: CommandoClient) {
    super(client, {
      name: 'abstain',
      aliases: ['abs', 'sitout', 'sit-out'],
      description: 'Abstain on a motion',

      args: [
        {
          key: 'reason',
          prompt: 'The reason for the vote',
          type: 'string',
          default: ''
        }
      ]
    })
  }
}
