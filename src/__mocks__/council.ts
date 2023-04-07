import { TextChannel, Guild, Client, Permissions } from "discord.js"
import Council from "../Council"

export const getCouncil = () =>
  new Council(
    new TextChannel(
      new Guild(new Client({ restSweepInterval: 0 }), {
        id: 123,
        roles: [
          { id: 123, permissions: [Permissions.ALL] },
          { id: "foo-role", permissions: [] },
        ],
        members: [
          {
            user: {
              username: "votum-app",
              id: "votum",
            },
          },
          {
            user: {
              username: "user-foo",
              id: "foo",
            },
          },
          {
            roles: ["foo-role"],
            user: {
              username: "user-bar",
              id: "bar",
            },
          },
        ],
      }),
      {
        id: "test-council",
      }
    )
  )
