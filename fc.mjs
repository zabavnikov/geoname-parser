import { readFile, readdir, writeFile } from 'node:fs/promises'

(async function () {
  const featureCodes = await readFile('./featureCodes_ru.txt', { encoding: 'utf8' })
  await writeFile(`./test.json`, JSON.stringify(featureCodes.split('\n'), null, 2))
})()