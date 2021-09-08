
# mongoose-paginate

> Lazy pagination plugin for [Mongoose](http://mongoosejs.com)

**Note:** This plugin only tested with Node.js >= 14 and Mongoose >= 5

## Installation

```sh
npm install mongoose-lazy-paginate
```

## Usage

Add plugin to a schema and then use model `paginate` method:

```js
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-lazy-paginate');

var schema = new mongoose.Schema({ /* schema definition */ });
schema.plugin(mongoosePaginate);

var Model = mongoose.model('Model',  schema); // Model.paginate()
```

### Model.paginate([query], [options], [callback])

**Parameters**

* `[query]` {Object} - Query criteria. [Documentation](https://docs.mongodb.org/manual/tutorial/query-documents)
* `[options]` {Object}
  - `[select]` {Object | String} - Fields to return (by default returns all fields). [Documentation](http://mongoosejs.com/docs/api.html#query_Query-select) 
  - `[sort]` {Object | String} - Sort order. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-sort) 
  - `[populate]` {Array | Object | String} - Paths which should be populated with other documents. [Documentation](http://mongoosejs.com/docs/api.html#query_Query-populate)
  - `[lean=false]` {Boolean} - Should return plain javascript objects instead of Mongoose documents?  [Documentation](http://mongoosejs.com/docs/api.html#query_Query-lean)
  - `[leanWithId=true]` {Boolean} - If `lean` and `leanWithId` are `true`, adds `id` field with string representation of `_id` to every document
  - `[offset=0]` {Number} - Use `offset` or `page` to set skip position
  - `[page=1]` {Number}
  - `[limit=10]` {Number}
* `[callback(err, result)]` - If specified the callback is called once pagination results are retrieved or when an error has occurred

**Return value**

Promise fulfilled with object having properties:
* `docs` {Array} - Array of documents
* `total` {Number} - Total number of documents in collection that match a query
* `limit` {Number} - Limit that was used
* `[page]` {Number} - Only if specified or default `page`/`offset` values were used 
* `[pages]` {Number} - Only if `page` specified or default `page`/`offset` values were used 
* `[offset]` {Number} - Only if specified or default `page`/`offset` values were used

### Examples

#### Skip 20 documents and return 10 documents

```js
Model.paginate({}, { page: 3, limit: 10 }, function(err, result) {
  // result.docs
  // result.total
  // result.limit - 10
  // result.page - 3
  // result.pages
});
```

Or you can do the same with `offset` and `limit`:

```js
Model.paginate({}, { offset: 20, limit: 10 }, function(err, result) {
  // result.docs
  // result.total
  // result.limit - 10
  // result.offset - 20
});
```

With promise:

```js
Model.paginate({}, { offset: 20, limit: 10 }).then(function(result) {
  // ...
});
```

#### More advanced example

```js
var query = {};
var options = {
  select: 'title date author',
  sort: { date: -1 },
  populate: 'author',
  lean: true,
  offset: 20, 
  limit: 10
};

Book.paginate(query, options).then(function(result) {
  // ...
});
```

#### Zero limit

Opposingly to mongoose-paginate we treat `limit=0` option as insignificant, so, default `limit=10` will be used, when in mongoose-pagintate you can use `limit=0` to get only metadata:

```js
Model.paginate({}, { offset: 100, limit: 0 }).then(function(result) {
  // result.docs - array of data if available
  // result.total
  // result.limit - 10
  // result.offset - 100
});
```

#### Set custom default options for all queries

config.js:

```js
var mongoosePaginate = require('mongoose-paginate');

mongoosePaginate.paginate.options = { 
  lean:  true,
  limit: 20
};
```

controller.js:

```js
Model.paginate().then(function(result) {
  // result.docs - array of plain javascript objects
  // result.limit - 20
});
```

## Tests

```sh
npm install
npm test
```

## License

[MIT](LICENSE)
