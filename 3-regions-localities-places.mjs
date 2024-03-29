import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'

(async function () {
  const placeFieldMap = [
    'geonameId',
    'name',
    'asciiName',
    'alternateNames',
    'latitude',
    'longitude',
    'featureClass',
    'featureCode',
    'countryCode',
    'cc2',
    'admin1Code',
    'admin2Code',
    'admin3Code',
    'admin4Code',
    'population',
    'elevation',
    'dem',
    'timezone',
    'modificationDate'
  ]

  const alternativeNames = JSON.parse(await readFile('./output/alternative-names.json', { encoding: 'utf8' }))
  const countries = await readdir('./output/data')
  const cyrillicPattern = /^[\sа-яё-]+$/im

  for await (const countryCode of countries) {
    if (existsSync(`./src/${countryCode}.txt`)) {
      const places = await readFile(`./src/${countryCode}.txt`, { encoding: 'utf8' })

      const regions = {}

      for await (let place of places.split('\n')) {
        place = place.split('\t')

        const data = {}

        for await (const [index, field] of placeFieldMap.entries()) {
          const fieldValue = place[index]

          if (fieldValue) {
            data[field] = fieldValue

            if (Object.hasOwn(alternativeNames, data.geonameId)) {
              data.name = alternativeNames[data.geonameId]
            } else if (field === 'alternateNames') {
              const alternateNames = data.alternateNames.split(',')

              if (alternateNames.length) {
                data.name = alternateNames
                  .filter(name => cyrillicPattern.test(name.trim()))
                  .at(-1)
              }

              data.alternateNames = alternateNames
            }
          } else {
            data.name = data.asciiName
          }
        }

        if (data.featureCode && data.name) {
          data.name = data.name
            .replace('Край', 'край')
            .replace('Область', 'область')

          // Регионы, штаты, области...
          if (data.featureCode === 'ADM1') {
            regions[data.admin1Code] = {
              name: data.name,
              lat: data.latitude,
              lng: data.longitude,
              country_code: data.countryCode,
              localities: {},
            }

            console.log('=========\n' + data.name + '\n=========')
          }

          // Населенные пункты, места, горы и т.д...
          if (cyrillicPattern.test(data.name) && Object.hasOwn(regions, data.admin1Code)) {
            const isAllowed = allowedFeatureCodes().filter((code) => {
              return `${data.featureClass}.${data.featureCode}`.startsWith(code)
            })

            if (isAllowed?.length > 0) {
              regions[data.admin1Code].localities[data.name] = {
                name: data.name,
                lat: data.latitude,
                lng: data.longitude,
                country_code: data.countryCode,
                feature_code: data.featureCode,
              }

              console.log('--- ' + data.name)
            }
          }
        }
      }

      if (Object.keys(regions).length) {
        await writeFile(`./output/data/${countryCode}/regions-localities-places.json`, JSON.stringify(regions, null, 2))
      }
    }
  }
})()

function allowedFeatureCodes() {
  return [
    "H.LK",
    "H.OCN",
    "H.SEA",
    "L.AMUS",
    "L.PRK",
    "L.RES",
    "L.RESF",
    "L.RESN",
    "L.RESP",
    "L.RESW",
    "P.PPL",
    "P.PPLC",
    "P.PPLF",
    "S.CAVE",
    "S.CSTL",
    "S.MUS",
    "S.PYR",
    "S.PYR",
    "S.ZOO",
    "T.DSRT",
    "T.MT",
    "T.PK",
    "T.PLAT",
    "T.VLC",
    "U.MTU",
    "U.PKSU",
    "U.PKU",
    "U.PLTU"
  ]
}