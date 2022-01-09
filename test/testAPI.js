/* eslint-disable no-undef */
const server = require('../server')
const chai = require('chai')
const chaiHttp = require('chai-http')

// Assertion
chai.should()
chai.use(chaiHttp)

describe('RND server api', () => {
  describe('player info', () => {
    it('It should return all tasks', (done) => {
      // game status
      chai.request(server)
      .get("/api/gameStatus")
      .end((err, response) => {
        response.should.have.status(200)
        response.body.should.be.a('object')
        response.body.should.not.be.eq(0)
      })

      // player info
      chai.request(server)
      .get("/api/myInfo/A")
      .end((err, response) => {
        response.should.have.status(200)
        response.body.should.be.a('object')
        response.body.should.not.be.eq(0)
      })

      chai.request(server)
      .post('/player')
      // .set('content-type', 'application/x-www-form-urlencoded')
      .type('form')
      .send({
        'socketId': '12345',
        'userId': 'A',
      })
      .end((err, response) => {
        if(err) console.log(err, response)
        else console.log(response)
      })
      done()
    })
  })
})