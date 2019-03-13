import { CommandoClient } from 'discord.js-commando'
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class YesCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = 1

  constructor (client: CommandoClient) {
    super(client, {
      name: 'yes',
      aliases: ['aye', 'si', 'yea', 'yay', 'ja', 'oui', 'da', 'да'],
      description: 'Vote yes on a motion',

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
