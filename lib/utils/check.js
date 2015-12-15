/*
-- Service error handeling for REST.
-- log - for responding successfully
-- error - for responding with error
-- validate - validating single or multiple records
*/

(function(){

	var log = require('../console');

	module.exports = {
		log: function(message, type, code){
			var res = {};

			if(typeof message === 'object'){
				res.log = { message: message.message, type: message.type };
			} else {
				res.log = { message: message, type: type };
			}

			res = JSON.stringify(res);

			log('d', res);

			return res;
		},
		error: function(message, type, code){
			var res = {};

			if(typeof message === 'object'){
				res.error = { message: message.message, type: message.type, code: message.code };
			} else {
				res.error = { message: message, type: type, code: code };
			}

			res = JSON.stringify(res);

			log('e', res);

			return res;
		},
		validate: function(data, type, to_string){
			if(to_string === undefined){
				to_string = true;
			}

			if(!data){
				var res = {};

				res.error = { message: 'record not found', type: type, code: 100 };
				res = JSON.stringify(res);

				log('e', res);

				return res;
			} else {
				if(data.length == undefined){
					data.password = undefined;
					data.__v = undefined;

					if(to_string){
						return JSON.stringify(data);
					} else {
						return data;
					}
				} else {
					if(data.length == 0){
						var res = {};

						res.error = { message: 'records not found', type: type, code: 100 };
						res = JSON.stringify(res);

						log('e', res);

						return res;
					} else {
						data.forEach(function(record){
							record.password = undefined;
							record.__v = undefined;
						});
						
						if(to_string){
							return JSON.stringify(data);
						} else {
							return data;
						}
					}
				}
			}
		},
		input: function(req, res, db, type, data){
			var self = this
				pass = true,
				source = '';

			if(data){

				if(Object.keys(req.body).length !== 0){
					source = 'body';
				} else {
					source = 'query';
				}

				data.forEach(function(key){
					if(!req[source][key]){
						res.end(self.error('Missing ' + key , type, 303));
						pass = false;
						return false;
					}
				});
			} else { 
				Object.keys(db[type].schema.paths).forEach(function(key, index, array){
					if(db[type].schema.paths[key].isRequired){
						if(!req.body[key]){
							res.end(self.error('Missing ' + key , type, 304));
							pass = false;
							return false;
						}
					}
				});
			}
		
			return pass;
		},
		empty: function(data){
			var res = {};

			Object.keys(data).forEach(function(key, index, array){
				if(data[key]){
					res[key] = data[key];
				}
			});

			return res;
		}
	};

})();