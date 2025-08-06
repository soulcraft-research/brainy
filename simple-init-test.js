import { BrainyData } from './dist/index.js'

console.log('Starting simple init test...')
const brainy = new BrainyData({
  storage: { type: 'memory' }
})

console.log('Calling init...')
await brainy.init()

console.log('Init complete!')
await brainy.add('test', { name: 'test' })
console.log('Add complete!')

const results = await brainy.searchText('test', 1)
console.log('Search complete! Found:', results.length)