/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2309606798")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2415649015",
    "max": 0,
    "min": 0,
    "name": "salt",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1926571146",
    "max": 0,
    "min": 0,
    "name": "title_nonce",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4032873797",
    "max": 0,
    "min": 0,
    "name": "title_ciphertext",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text830401601",
    "max": 0,
    "min": 0,
    "name": "username_nonce",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3542447137",
    "max": 0,
    "min": 0,
    "name": "username_ciphertext",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3814796384",
    "max": 0,
    "min": 0,
    "name": "paswword_nonce",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text697078724",
    "max": 0,
    "min": 0,
    "name": "password_ciphertext",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2004942218",
    "max": 0,
    "min": 0,
    "name": "url_nonce",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3158059848",
    "max": 0,
    "min": 0,
    "name": "url_ciphertext",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2309606798")

  // remove field
  collection.fields.removeById("text2415649015")

  // remove field
  collection.fields.removeById("text1926571146")

  // remove field
  collection.fields.removeById("text4032873797")

  // remove field
  collection.fields.removeById("text830401601")

  // remove field
  collection.fields.removeById("text3542447137")

  // remove field
  collection.fields.removeById("text3814796384")

  // remove field
  collection.fields.removeById("text697078724")

  // remove field
  collection.fields.removeById("text2004942218")

  // remove field
  collection.fields.removeById("text3158059848")

  return app.save(collection)
})
