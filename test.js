#!/usr/bin/env node

var r = require("rethinkdb")
var Query = require("./lib/query")
var pd = console.log.bind(console)
var log = console.log.bind(console)

var fixtures = [
  {id: 1, a: 1},
  {id: 2, a: 1, b: 2},
  {id: 3, a: 2},
  {id: 4, a: 2}
]

//var q = {where: {a: 1}}
//var q = {where: {a: 1, b: 2}}
//var q = {where: {a: {">": 1}}}
//var q = {where: {or: [{id: 1}, {id: 2}]}}
//var q = {where: {a: {">": 1}, or: [{id: 3}]}}

//var q = {where: null}
//var q = {limit: 1}
//var q = {where: {id: 1}, limit: 1}

r.connect((err, conn) => {
  if (err) throw err

  //r.table("sailsRethinkdb").delete().run(conn, () => r.table("sailsRethinkdb").insert(fixtures).run(conn))

  Query.build(r.table("sailsRethinkdb"), q).run(conn, (err, result) => {
    if (err) throw err
    result.toArray((err, result) => {
      if (err) throw err
      log(result)
    })
  })
})
