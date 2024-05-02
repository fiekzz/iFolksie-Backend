import { createClient } from 'redis'

const client = createClient({
    url: 'redis://localhost:6379',
})

client.on('error', (error) => {
    console.error(error)
})

await client.connect()

await client.set('2116893', JSON.stringify({
    paymentType: 'MONTHLY',
    paymentAmount: 1234
}))

await client.disconnect()