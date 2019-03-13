import { CommandoClient } from 'discord.js-commando'
import VoteAliasCommand from '../abstract/VoteAliasCommand'

export default class NoCommand extends VoteAliasCommand {
  protected state: 1 | 0 | -1 = -1

  constructor (client: CommandoClient) {
    super(client, {
      name: 'no',
      aliases: ['nay', 'negative', 'nope', 'nein', 'ne', 'не'],
      description: 'Vote no on a motion',

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
