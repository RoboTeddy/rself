const request = require('request-promise-native')
const moment = require('moment-timezone')
const mysql = require('mysql2/promise')

const TZ = 'America/Los_Angeles'

const buzz = async ms => {
  await request({
    method: 'POST',
    uri: `${process.env.PARTICLE_DEVICE_URL}/buzz`,
    form: {
      args: ms.toString(),
      access_token: process.env.PARTICLE_ACCESS_TOKEN,
    },
  })
}

const createMysqlConnection = () =>
  mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    queryFormat: function(query, values) {
      if (!values) return query
      return query.replace(
        /\:(\w+)/g,
        function(txt, key) {
          if (values.hasOwnProperty(key)) {
            return this.escape(values[key])
          }
          return txt
        }.bind(this)
      )
    },
    typeCast: function (field, next) {
      if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
        const value = field.string()
        return (value === null) ? null : Number(value);
      }
      return next()
    }
  })


const handlers = {
  setBedtime: async ({bedtimeHrsAfterMidnight}, context) => {
    const db = await createMysqlConnection()
    await db.query(
      `INSERT INTO bedtimes (bedtimeHrsAfterMidnight, createdMts)
      VALUES (:bedtimeHrsAfterMidnight, :createdMts)`,
      {bedtimeHrsAfterMidnight, createdMts: Date.now()}
    )
    await db.end()
    context.done(null, {statusCode: 200, headers: {}, body: ''})
  },

  getBedtime: async (params, context) => {
    const db = await createMysqlConnection()
    const [[{bedtimeHrsAfterMidnight}]] = await db.query(
      'SELECT * from bedtimes ORDER BY id DESC LIMIT 1'
    )
    await db.end()
    context.done(null, {
      statusCode: 200,
      headers: {},
      body: JSON.stringify(bedtimeHrsAfterMidnight)
    })
  },

  R: async (params, context) => {
    const resistance = Number.parseFloat(params.data)
    const resistanceThreshold = 1280 // ohms
    const isInBed = resistance > resistanceThreshold
    const mts = Date.now()

    const db = await createMysqlConnection()
    const [[{bedtimeHrsAfterMidnight}]] = await db.query(
      'SELECT * from bedtimes ORDER BY id DESC LIMIT 1'
    )

    console.log('bedtimeHrsAfterMidnight', bedtimeHrsAfterMidnight)

    const bedTimeMts = moment
      .tz(mts, TZ)
      .startOf('day')
      .add(bedtimeHrsAfterMidnight, 'hours')
    const afterBedTimeMts = Date.now() - bedTimeMts

    /*
    Note: there's technically a race condition here

    The sender calls us every 60 seconds; it might be that one request
    occurs just before the violation period and another occurs just after.

    Wrote it this way because it was easy and so the receiver can stay stateless;
    logging is just for logging.
    */
    const isViolation =
      afterBedTimeMts > 0 && afterBedTimeMts <= 60 * 1000 && !isInBed

    console.log('isViolation?', isViolation)

    await db.query(
      `INSERT INTO bedLog (resistance, isInBed, isViolation, createdMts)
      VALUES (:resistance, :isInBed, :isViolation, :createdMts)`,
      {resistance, isInBed: isInBed ? 1 : 0, isViolation, createdMts: mts}
    )

    await db.end()

    if (isViolation) await buzz(3000)

    console.log('done!')
    context.done(null, {statusCode: 200, headers: {}, body: ''})
  }
}


exports.handler = async (event, context) => {
  const params = JSON.parse(event.body)
  await handlers[params.event](params, context)
}
