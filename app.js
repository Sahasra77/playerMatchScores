const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()
app.use(express.json())
let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertPlayerObjToResponseObj = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

const convertMatchObjToResponseObj = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}

const convertPlayerMatchObjToResponseObj = dbObj => {
  return {
    playerMatchId: dbObj.player_match_id,
    playerId: dbObj.player_id,
    matchId: dbObj.match_id,
    score: dbObj.score,
    fours: dbObj.fours,
    sixes: dbObj.sixes,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    select * from player_details;`
  const playersArray = await database.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertPlayerObjToResponseObj(eachPlayer)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    select * from player_details where player_id = ${playerId};`
  const player = await database.get(getPlayerQuery)
  response.send(convertPlayerObjToResponseObj(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerId, playerName} = request.body
  const updatePLayerDetailsQuery = `
    update player_details set 
                              player_name = '${playerName}'
                              where player_id = ${playerId};`
  await database.run(updatePLayerDetailsQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDeetsQuery = `
    select * from match_details where match_id = ${matchId};`
  const match = await database.get(getMatchDeetsQuery)
  response.send(convertMatchObjToResponseObj(match))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
  select * from player_match_score natural join match_details
  where player_id = ${playerId};`
  const playerMatches = await database.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch => convertMatchObjToResponseObj(eachMatch)),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
    select * from player_match_score natural join player_details where match_id = ${matchId};`
  const playersArray = await database.all(getMatchPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertPlayerMatchObjToResponseObj(eachPlayer),
    ),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchPLayersQuery = `
    select player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score
    natural join player_details where player_id = ${playerId};`
  const playerMatchDetails = await database.get(getMatchPLayersQuery)
  response.send(playerMatchDetails)
})

module.exports = app
