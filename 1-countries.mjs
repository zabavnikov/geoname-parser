import { mkdirSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'

(async function () {
  fetch('http://api.geonames.org/countryInfoJSON?username=placehub&lang=ru')
    .then((response) => response.json())
    .then(async ({ geonames }) => {
      for await (const country of geonames) {
        const fields = {
          capital: country.capital,
          country_code: country.countryCode,
          name: country.countryName,
        }

        if (! existsSync(`./output/data/${country.countryCode}`)) {
          await mkdirSync(`./output/data/${country.countryCode}`, { recursive: true })
        }

        await writeFile(`./output/data/${country.countryCode}/country.json`, JSON.stringify(fields, null, 2))

        if (! await existsSync(`./src/${country.countryCode}.zip`)) {
          const response = await fetch(`https://download.geonames.org/export/dump/${country.countryCode}.zip`)

          const buffer = await response.arrayBuffer()
          await writeFile(`./src/${country.countryCode}.zip`, Buffer.from(buffer))
        }

        console.log(country.countryName)
      }
    })
})()