import knex from 'knex'
import { readdir, readFile } from 'node:fs/promises'

const database = knex({
  client: 'mysql2',
  connection: {
    database: 'placehub',
    host:     '127.0.0.1',
    password: 'qwerty56789',
    port:     3306,
    user:     'root',
  }
})

const countryCodes = await readdir('./output/data')

for await (const countryCode of countryCodes) {
  const country = JSON.parse(
    await readFile(`./output/data/${countryCode}/country.json`, {
      encoding: 'utf8'
    })
  )
}