import { createReadStream } from 'node:fs'
import { writeFile } from 'node:fs/promises'

(() => {
  const cyrillicPattern = /^[\sа-яё-]+$/im
  const data = {}

  createReadStream('./src/alternateNamesV2.txt')
    .on('data', async (chunk) => {
      chunk = chunk.toString()

      for await (let row of chunk.split('\n')) {
        row = row.split('\t')

        // Проверяем что название на русском.
        if (row[2] === 'ru' && cyrillicPattern.test(row[3])) {
          data[row[1]] = row[3]
          console.log(`${row[1]}: ${row[3]}`)
        }
      }
    }).on('end', () => writeFile(`./output/alternative-names.json`, JSON.stringify(data, null, 2)))
})()