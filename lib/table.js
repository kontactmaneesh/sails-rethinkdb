const r = require("rethinkdb")
const Query = require("./query")
const debug = require("debug")("sails-rethinkdb")

function buildUpdateData(data, literal) {
  return Object
    .keys(data)
    .filter((key) => data[key] !== undefined)
    .reduce((obj, key) => {
      if (literal && typeof data[key] === 'object') {
        obj[key] = r.literal(data[key]);
      } else {
        obj[key] = data[key];
      }

      return obj;
    }, {});
}

module.exports = class Table {
  constructor(conn, name) {
    this.conn = conn
    this.table = r.db(conn.db).table(name)
    this.table.conn = conn // for native method
    this.table.r = r // for native method
  }

  insert(data, cb) {
    this.table.insert(data, {returnChanges: true}).run(this.conn, (err, result) => {
      if (err) return cb(err)
      if (result.errors > 0) return cb(new Error(result.first_error))
      cb(null, result.inserted > 0 ? result.changes[0].new_val : null)
    })
  }

  insertEach(data, cb) {
    if (data.length === 0)
      return cb(null, [])
    this.table.insert(data, {returnChanges: true}).run(this.conn, (err, result) => {
      if (err) return cb(err)
      if (result.errors > 0) return cb(new Error(result.first_error))
      cb(null, result.inserted > 0 ? result.changes.map(v => v.new_val) : [])
    })
  }

  find(query, cb) {
    Query.build(this.table, query).run(this.conn, (err, cursor) => {
      if (err) return cb(err)
      cursor.toArray((err, result) => {
        //debug("[result] find", this.table, query, result)
        cb(err, result)
      })
    })
  }

    update(query, data, cb) {
    const returnChanges = query.returnChanges === false ? false : true; // default true
    delete query.select; // select is not supported for update

    Query
      .build(this.table, query)
      .update(buildUpdateData(data, query.literal), { returnChanges: returnChanges })
      .run(this.conn, (err, result) => {
        if (err) return cb(err)
        if (result.errors > 0) return cb(new Error(result.first_error))
        cb(null, returnChanges && result.replaced > 0 ? result.changes[0].new_val : [])
      })
  }

  destroy(query, cb) {
    Query.build(this.table, query).delete({returnChanges: true}).run(this.conn, (err, result) => {
      if (err) return cb(err)
      if (result.errors > 0) return cb(new Error(result.first_error))
      cb(null, result.deleted > 0 ? result.changes.map(v => v.old_val.id) : [])
    })
  }

  count(query, cb) {
    Query.build(this.table, query).count().run(this.conn, (err, result) => {
      if (err) return cb(err)
      cb(null, result)
    })
  }


  join(query, cb) {
    Query.build(this.table, query).run(this.conn, (err, cursor) => {
      if (err) return cb(err)
      cursor.toArray(cb)
    })
  }
}
