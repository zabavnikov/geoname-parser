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

function allowedFeatureCodes() {
  return [
    "H.BAY",
    "H.BAYS",
    "H.BOG",
    "H.CAPG",
    "H.CHN",
    "H.FJD",
    "H.FJDS",
    "H.FLLS",
    "H.GLCR",
    "H.GULF",
    "H.GYSR",
    "H.HBR",
    "H.LGN",
    "H.LGNS",
    "H.LK",
    "H.LKN",
    "H.LKO",
    "H.LKS",
    "H.LKSB",
    "H.LKSC",
    "H.MGV",
    "H.OCN",
    "H.OVF",
    "H.PND",
    "H.RDGG",
    "H.RF",
    "H.RFC",
    "H.SD",
    "H.SEA",
    "H.SPNG",
    "H.SPNS",
    "H.SPNT",
    "H.STM",
    "H.STMA",
    "H.STMD",
    "H.STMH",
    "H.STMI",
    "H.STMIX",
    "H.STMM",
    "H.STMQ",
    "H.STMS",
    "H.STRT",
    "H.SWMP",
    "H.WAD",
    "H.WADB",
    "H.WADJ",
    "H.WADM",
    "H.WADS",
    "H.WTRC",
    "L.AMUS",
    "L.CLG",
    "L.CST",
    "L.LAND",
    "L.OAS",
    "L.PRK",
    "L.PRT",
    "L.QCKS",
    "L.RES",
    "L.RESA",
    "L.RESF",
    "L.RESH",
    "L.RESN",
    "L.RESP",
    "L.RESV",
    "L.RESW",
    "L.RGNL",
    "L.SNOW",
    "L.TRB",
    "P.PPL",
    "P.PPLA",
    "P.PPLA",
    "P.PPLA",
    "P.PPLA",
    "P.PPLA5",
    "P.PPLC",
    "P.PPLCH",
    "P.PPLF",
    "P.PPLL",
    "P.PPLR",
    "P.PPLS",
    "P.PPLW",
    "P.STLMT",
    "R.RRQ",
    "R.RTE",
    "R.TNLN",
    "S.AIRP",
    "S.AMTH",
    "S.ANS",
    "S.ART",
    "S.ASTR",
    "S.ASYL",
    "S.ATHF",
    "S.BCN",
    "S.BDG",
    "S.CARN",
    "S.CAVE",
    "S.CH",
    "S.CMTY",
    "S.CSTL",
    "S.ESTT",
    "S.FT",
    "S.LTHSE",
    "S.MALL",
    "S.MLWND",
    "S.MNQ",
    "S.MSQE",
    "S.MUS",
    "S.OBS",
    "S.OBSR",
    "S.PGDA",
    "S.PYR",
    "S.PYRS",
    "S.RUIN",
    "S.SHRN",
    "S.THTR",
    "S.TRIG",
    "S.WALLA",
    "S.WRCK",
    "S.ZOO",
    "T.ATOL",
    "T.BCH",
    "T.BCHS",
    "T.BLOW",
    "T.BNCH",
    "T.BUTE",
    "T.CAPE",
    "T.CFT",
    "T.CLDA",
    "T.CLF",
    "T.CNYN",
    "T.CONE",
    "T.CRDR",
    "T.CRQ",
    "T.CRQS",
    "T.CRTR",
    "T.CUET",
    "T.DLTA",
    "T.DPR",
    "T.DSRT",
    "T.DUNE",
    "T.DVD",
    "T.ERG",
    "T.FAN",
    "T.FORD",
    "T.FSR",
    "T.GAP",
    "T.GRGE",
    "T.HDLD",
    "T.HLL",
    "T.HLLS",
    "T.HMCK",
    "T.HMDA",
    "T.ISL",
    "T.ISLM",
    "T.ISLS",
    "T.ISLT",
    "T.ISTH",
    "T.KRST",
    "T.LAVA",
    "T.MESA",
    "T.MND",
    "T.MRN",
    "T.MT",
    "T.MTS",
    "T.NKM",
    "T.NTK",
    "T.NTKS",
    "T.PAN",
    "T.PANS",
    "T.PASS",
    "T.PEN",
    "T.PENX",
    "T.PK",
    "T.PKS",
    "T.PLAT",
    "T.PLDR",
    "T.PLN",
    "T.PROM",
    "T.PT",
    "T.PTS",
    "T.RDGB",
    "T.RDGE",
    "T.REG",
    "T.RK",
    "T.RKFL",
    "T.RKS",
    "T.SAND",
    "T.SBED",
    "T.SCRP",
    "T.SDL",
    "T.SHOR",
    "T.SINK",
    "T.SLID",
    "T.SLP",
    "T.SPIT",
    "T.SPUR",
    "T.TAL",
    "T.TRGD",
    "T.TRR",
    "T.UPLD",
    "T.VAL",
    "T.VALG",
    "T.VALS",
    "T.VLC",
    "U.APNU",
    "U.ARCU",
    "U.ARRU",
    "U.BDLU",
    "U.BSNU",
    "U.CDAU",
    "U.CNSU",
    "U.CNYU",
    "U.CRSU",
    "U.DEPU",
    "U.EDGU",
    "U.ESCU",
    "U.FANU",
    "U.FLTU",
    "U.FRZU",
    "U.FURU",
    "U.GAPU",
    "U.GLYU",
    "U.HLLU",
    "U.HLSU",
    "U.HOLU",
    "U.KNLU",
    "U.KNSU",
    "U.LDGU",
    "U.LEVU",
    "U.MESU",
    "U.MNDU",
    "U.MOTU",
    "U.MTU",
    "U.PKSU",
    "U.PKU",
    "U.PLTU",
    "U.PNLU",
    "U.PRVU",
    "U.RDGU",
    "U.RDSU",
    "U.RFSU",
    "U.RFU",
    "U.RISU",
    "U.SCNU",
    "U.SCSU",
    "U.SDLU",
    "U.SHFU",
    "U.SHLU",
    "U.SHSU",
    "U.SHVU",
    "U.SILU",
    "U.SLPU",
    "U.SMSU",
    "U.SMU",
    "U.SPRU",
    "U.TERU",
    "U.TMSU",
    "U.TMTU",
    "U.TNGU",
    "U.TRGU",
    "U.TRNU",
    "U.VALU",
    "U.VLSU",
    "V.FRST",
    "V.FRSTF",
    "V.GRSLD",
    "V.GRVP",
    "V.GRVPN",
    "V.MDW",
    "V.TUND"
  ]
}