import { getCouncil as getCouncilMock } from "./__mocks__/council"
import { promises as fs } from "fs"
import path from "path"
import { MotionResolution } from "./Motion"

jest.mock("./Votum", () => jest.fn().mockImplementation(() => ({})))

const clearDataFolder = async () => {
  // https://stackoverflow.com/a/42182416/13152732
  const directory = `${__dirname}/../data`

  for (const file of await fs.readdir(directory)) {
    if (/test-/.exec(file)) await fs.unlink(path.join(directory, file))
  }
}

describe("Council Class Test", () => {
  afterEach(async () => {
    await clearDataFolder()
  })
  afterAll(async () => {
    await clearDataFolder()
  })
  test("Should correctly define Councilor Role", () => {
    const council = getCouncilMock()

    expect(council.mentionString).toBe("")
    expect(council.getConfig("councilorRole")).toBe(undefined)
    expect(council.councilorRole).toBe(undefined)

    council.setConfig("councilorRole", "foo")

    expect(council.councilorRole).toBe("foo")
    expect(council.getConfig("councilorRole")).toBe("foo")
    expect(council.mentionString).toBe("<@&foo>")
  })
  test("Should get correct members based in councilorRole definition", () => {
    const council = getCouncilMock()

    expect(council.size).toBe(2)
    expect(council.members.get("votum")).not.toBe(undefined)

    council.setConfig("councilorRole", "foo-role")
    expect(council.size).toBe(1)
    expect(council.members.get("bar")).not.toBe(undefined)
  })
  test("Should create motion", () => {
    const council = getCouncilMock()

    expect(council.currentMotion).toBe(undefined)
    expect(council.numMotions).toBe(0)
    expect(() => council.getMotion(0)).toThrow()

    council.createMotion({
      authorId: "",
      authorName: "",
      active: false,
      resolution: MotionResolution.Unresolved,
      text: "Not Active Motion #1",
      createdAt: 0,
      didExpire: false,
      votes: [],
    })

    council.createMotion({
      authorId: "",
      authorName: "",
      active: true,
      resolution: MotionResolution.Unresolved,
      text: "Motion #1",
      createdAt: 0,
      didExpire: false,
      votes: [],
    })

    expect(council.currentMotion?.text).toBe("Motion #1")
    expect(council.numMotions).toBe(2)
    expect(council.getMotion(1).text).toBe("Motion #1")
  })

  describe("Should get correct weights", () => {
    test("Should correctly calc ulate in a non-weighted council", async () => {
      const council = getCouncilMock()

      //@ts-ignore
      council.getConfig = () => undefined
      expect(await council.calculateWeights()).toStrictEqual({
        total: 2,
        users: {},
      })
    })

    test("Should correctly calculate for users with weight", async () => {
      const council = getCouncilMock()
      //@ts-ignore
      council.getConfig = () => ({
        foo: 10,
        bar: 15,
      })

      expect(await council.calculateWeights()).toStrictEqual({
        total: 26,
        users: {
          bar: 15,
          foo: 10,
        },
      })
    })

    test("Should correctly calculate for roles with weight", async () => {
      const council = getCouncilMock()
      //@ts-ignore
      council.getConfig = () => ({
        "foo-role": 10,
      })

      expect(await council.calculateWeights()).toStrictEqual({
        total: 12,
        users: {
          bar: 10,
        },
      })
    })
  })

  test("Should user coolDown", () => {
    const council = getCouncilMock()

    const HOUR_IN_MS = 3600000
    const THIRTY_MIN_IN_MS = HOUR_IN_MS / 2
    const FIFTEEN_MIN_IN_MS = THIRTY_MIN_IN_MS / 2

    const date = Date.now()
    jest.useFakeTimers().setSystemTime(date)

    expect(council.getUserCooldown("foo")).toBe(-date)
    expect(council.isUserOnCooldown("foo")).toBe(false)

    council.setConfig("userCooldown", THIRTY_MIN_IN_MS)

    council.setUserCooldown("foo")
    expect(council.isUserOnCooldown("foo")).toBe(true)
    expect(council.getUserCooldown("foo")).toBe(THIRTY_MIN_IN_MS)

    jest.useFakeTimers().setSystemTime(date + FIFTEEN_MIN_IN_MS)
    expect(council.getUserCooldown("foo")).toBe(FIFTEEN_MIN_IN_MS)

    jest.useFakeTimers().setSystemTime(date + HOUR_IN_MS)
    expect(council.isUserOnCooldown("foo")).toBe(false)
    expect(council.getUserCooldown("foo")).toBe(-THIRTY_MIN_IN_MS)
  })
})
