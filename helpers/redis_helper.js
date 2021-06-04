const redis = require('redis')
require('dotenv').config()

const client = redis.createClient({
    password: process.env.REDIS_SECRET ,
    port: 11507,
    host: 'redis-11507.c228.us-central1-1.gce.cloud.redislabs.com'
})

client.on('connect', () => {
console.log('Client connected to redis...')
})

client.on('ready', () => {
  console.log('Client connected to redis and ready to use...')
})

client.on('error', (err) => {
  console.log(err.message)
})

client.on('end', () => {
  console.log('Client disconnected from rediss')
})

process.on('SIGINT', () => {
  client.quit()
})

module.exports = client