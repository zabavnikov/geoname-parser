import knex from 'knex'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const database = knex({
  client: 'mysql2',
  connection: {
    host:     '127.0.0.1',
    port:     3306,
    user:     'root',
    password: 'qwerty56789',
    database: 'placehub',
  }
})

database('places')
  .where({
    type: 'country',
  })
  .select(['id', 'country_code', 'name'])
  .then(async (countries) => {
    for await (const country of countries) {
      const file = `./output/data/${country.country_code}/regions-localities-places.json`

      if (existsSync(file)) {
        const regions = JSON.parse(await readFile(file, { encoding: 'utf-8' }))

        for await (const region of Object.entries(regions)) {
          const [_, regionData] = region

          await database('places')
            .insert({
              country_code: regionData.country_code,
              lat:          regionData.lat,
              lng:          regionData.lng,
              name:         regionData.name,
              parent_id:    country.id,
              type:         'region',
              user_id:      1,
            })
            .onConflict(['parent_id', 'type', 'name'])
            .ignore()

          console.log('===== START =====\n' + regionData.name)

          if (Object.keys(regionData.localities).length) {
            await database('places')
              .where({
                type: 'region',
                name: regionData.name,
                country_code: regionData.country_code,
              })
              .first('*')
              .then(async (region) => {
                if (region) {
                  const places = []

                  for await (const [_, localityData] of Object.entries(regionData.localities)) {
                    places.push({
                      country_code: region.country_code,
                      lat: localityData.lat,
                      lng: localityData.lng,
                      name: localityData.name,
                      parent_id: region.id,
                      type: localityData.feature_code.startsWith('PPL') ? 'locality' : 'poi',
                      user_id: 1,
                    })
                  }

                  await database('places')
                    .insert(places)
                    .onConflict(['parent_id', 'type', 'name'])
                    .ignore()
                }
              })
          }

          console.log('===== END =====')
        }
      }
    }
  })


