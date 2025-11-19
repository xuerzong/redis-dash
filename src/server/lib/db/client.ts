import fs from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import { ensureDir } from '@/server/lib/fs'
import { dirname } from '@/utils/dirname'

const rootDir = process.env.NODE_ENV === 'dev' ? process.cwd() : dirname

const dbDir = path.resolve(rootDir, '.db')

export class Database<Data extends Record<string, any> = {}> {
  static init() {
    ensureDir(dbDir)
  }

  private readonly dbName: string
  constructor(dbName: string) {
    this.dbName = dbName
  }

  async init() {
    ensureDir(path.resolve(dbDir, this.dbName))
  }

  async find(id: string): Promise<Data | null> {
    const row = await fs.readFile(
      path.resolve(dbDir, this.dbName, `${id}.json`),
      'utf-8'
    )
    try {
      return { ...JSON.parse(row), id }
    } catch (e: any) {
      console.log(e.message)
      return null
    }
  }

  async findMany(): Promise<Data[]> {
    const rows = await fs.readdir(path.resolve(dbDir, this.dbName), 'utf-8')
    try {
      return Promise.all(
        rows
          .map((row) => row.replace('.json', ''))
          .map(async (row) => {
            const rowData: Data | null = await this.find(row)
            return rowData
          })
      ).then((res) => res.filter((res) => res !== null))
    } catch (e: any) {
      console.log(e.message)
      return []
    }
  }

  async insert(data: Data) {
    return this.write(data)
  }

  async write(data: Data) {
    const id = data.id || nanoid(8)
    try {
      await fs.writeFile(
        path.resolve(dbDir, this.dbName, `${id}.json`),
        JSON.stringify(data)
      )
      return id
    } catch (e: any) {
      throw new Error(e)
    }
  }

  async update(id: string, data: any) {
    const current = await this.find(id)
    await this.write({ ...current, ...data, id })
  }

  async del(id: string) {
    try {
      await fs.unlink(path.resolve(dbDir, this.dbName, `${id}.json`))
    } catch {
      // pass?
    }
  }
}
