import Motion from "./Motion"
// @ts-ignore
import Votum from "./Votum"
import { promises as fs } from "fs"
import path from "path"
import { MotionData } from "./MotionData"
import { MotionResolution } from "./Motion"

jest.mock("./Votum", () => jest.fn().mockImplementation(() => ({})))

const clearDataFolder = async () => {
  // https://stackoverflow.com/a/42182416/13152732
  const directory = `${__dirname}/../data`

  for (const file of await fs.readdir(directory)) {
    if (file.match(/test-/)) await fs.unlink(path.join(directory, file))
  }
}

describe("Motion Class Test", () => {
    afterEach(async() => {
        await clearDataFolder()
    })
    afterAll(async() => {
        await clearDataFolder()
    })
test("Should start a motion correctly", () => {
    const foo: MotionData = {
        authorId: "",
        authorName: "",
        active: false,
        resolution: MotionResolution.Unresolved,
        text: "",
        createdAt: 0,
        didExpire: false,
        votes: []
    }
    //@ts-ignore
    const motion = new Motion(0, foo, {})

    expect(motion.authorId).toBe("")
    expect(motion.authorName).toBe("")
    expect(motion.number).toBe(1)
    //is expired
    expect(motion.votes).toStrictEqual([])
    expect(motion.createdAt).toBe(0)
    expect(motion.text).toBe("")
    expect(motion.resolution).toBe(MotionResolution.Unresolved)
    //requiredMajority
    expect(Object.is(motion.getData, foo))
})})