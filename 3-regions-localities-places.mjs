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

  const allowedFeatureCodes = [
    // Населенные пункты.
    'P.PPL',

    // Гидрографические.
    'H.BAY', 'H.FJD', 'H.FLLS', 'H.GLCR', 'H.GULF', 'H.GYSR', 'H.HBR', 'H.LGN', 'H.LK', 'H.OCN',
    'H.RF', 'H.SD', 'H.SEA', 'H.SPNG', 'H.SPNS', 'H.SPNT', 'H.STM', 'H.STRT', 'H.SWMP',

    'L.AMUS', 'L.CLG', 'L.CMN', 'L.CST', 'L.OAS', 'L.PRK', 'L.QCKS', 'L.RES', 'L.RGNL', 'L.SNOW', 'L.TRB',
    'S.AIRP', 'S.AMTH', 'S.ANS', 'S.ARCH', 'S.ART', 'S.ASTR', 'S.BCN', 'S.BDG', 'S.CAVE', 'S.CH', 'S.CSTL', 'S.GHSE',
    'S.HSTS', 'S.HTL', 'S.LTHSE', 'S.MKT', 'S.MNMT', 'S.MSQE', 'S.MUS', 'S.PAL', 'S.PGDA', 'S.PYR', 'S.REST', 'S.RSRT',
    'S.RUIN', 'S.SNTR', 'S.THTR', 'S.WALLA', 'S.ZOO',
    'T.ATOL', 'T.BCH', 'T.CAPE', 'T.CFT', 'T.CLDA', 'T.CLF', 'T.CNYN', 'T.CRTR', 'T.DSRT', 'T.ERG', 'T.ISL', 'T.MESA',
    'T.MT', 'T.PK', 'T.PLAT', 'T.PT', 'T.RDGE', 'T.RK', 'T.RKS', 'T.SAND', 'T.SINK', 'T.UPLD', 'T.VLC',
    'U.CNSU', 'U.CNYU', 'U.MTU', 'U.PKSU', 'U.PKU', 'U.PLTU', 'U.RDGU', 'U.RDSU',
    'V.FRST', 'V.GRSLD', 'V.GRVPN'
  ];

  // Остановился на H.STMX.

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
            /*const isAllowed = allowedFeatureCodes.filter((code) => {
              return `${data.featureClass}.${data.featureCode}`.startsWith(code)
            })*/

            if (! data.featureCode.startsWith('ADM')) {
              regions[data.admin1Code].localities[data.name] = {
                name: data.name,
                lat: data.latitude,
                lng: data.longitude,
                feature_code: data.featureCode,
                country_code: data.countryCode,
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