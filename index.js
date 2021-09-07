'use strict';

/**
 * @package mongoose-paginate
 * @param {Object} [query={}]
 * @param {Object} [options={}]
 * @param {Object|String} [options.select]
 * @param {Object|String} [options.sort]
 * @param {Array|Object|String} [options.populate]
 * @param {Boolean} [options.lean=false]
 * @param {Boolean} [options.leanWithId=true]
 * @param {Number} [options.offset=0] - Use offset or page to set skip position
 * @param {Number} [options.page=1]
 * @param {Number} [options.limit=10]
 * @param {Function} [callback]
 * @returns {Promise}
 */

function paginate(query, options, callback) {
  query = query || {};
  options = Object.assign({}, paginate.options, options);
  let select = options.select;
  let sort = options.sort;
  let populate = options.populate;
  let lean = options.lean || false;
  let leanWithId = options.leanWithId !== undefined ? options.leanWithId : true;
  let limit = options.limit ? options.limit : 10;
  let page, offset, skip, promises;
  if (options.offset) {
    offset = options.offset;
    skip = offset;
  } else if (options.page) {
    page = options.page;
    skip = (page - 1) * limit;
  } else {
    page = 1;
    offset = 0;
    skip = offset;
  }
  if (limit) {
    let docsQuery = this.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(lean);
    if (populate) {
      [].concat(populate).forEach((item) => {
        docsQuery.populate(item);
      });
    }
    promises = [
      new Promise((resolve, reject) => {
        docsQuery.exec((error, docs) => {
          if (error) {
            return reject({error});
          }
          if (docs.length < limit) {
            // in case this is last page, rejecting promise to prevent execution of countDocuments
            return reject([{
              docs,
              count: skip + docs.length
            }]);
          }
          return resolve({docs});
        })
      }),
      this.countDocuments(query).exec()
    ];
    if (lean && leanWithId) {
      promises[0] = promises[0].then(({docs, count}) => {
        docs.forEach((doc) => {
          doc.id = String(doc._id);
        });
        return {docs, count};
      });
    }
  }
  

  // we use the same handler for both then and catch to skip countDocuments call if it's not required
  // in some edge cases we can calculate total count of documents based only on query result
  // if any of the promises return an error we throw it.
  const handler = ([data, countDocuments]) => {
    if (data.error) {
      throw data.error;
    }
    let result = {
      docs: data.docs,
      total: data.count || countDocuments,
      limit: limit
    };
    if (offset !== undefined) {
      result.offset = offset;
    }
    if (page !== undefined) {
      result.page = page;
      result.pages = Math.ceil(result.total / limit) || 1;
    }
    if (typeof callback === 'function') {
      return callback(null, result);
    }
    return new Promise((resolve, _reject) => {
      return resolve(result);
    });
  };
  return Promise.all(promises)
    .then(handler)
    .catch(handler);
}

/**
 * @param {Schema} schema
 */

module.exports = function(schema) {
  schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
