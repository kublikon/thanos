/*
-- Thi module is for formatting console log statements to a predictible
-- pattern. Preferred use is through 'log()' to prevent overwriting default
-- methods.

-- e - error
-- w - warning
-- i - info
-- d - debug
-- de - detail
-- wtf - bad stuff
*/

(function(){ 

	var colors = require('colors'),
		config = require('./config');

	module.exports = function(type, message){

		if(config.mode == 'dev-detail'){
			switch(type){
				case 'e':
					console.log('   error -'.red, message);
					break;
				case 'w':
					console.log('   warn  -'.magenta, message);
					break;
				case 'i':
					console.log('   info  -'.cyan, message);
					break;
				case 'd': 
					console.log('   debug -'.grey, message);
					break;
				case 'de':
					console.log('   dev   -'.green, message);
					break;
				case 'wtf':
					console.log('   wtf?  -'.red, message + ' \n \n   note: you fucked up, remember to breathe then check your shit! \n');
					break;
			}
		} else if(config.mode == 'dev'){
			switch(type){
				case 'e':
					console.log('   error -'.red, message);
					break;
				case 'w':
					console.log('   warn  -'.magenta, message);
					break;
				case 'i':
					console.log('   info  -'.cyan, message);
					break;
				case 'd': 
					console.log('   debug -'.grey, message);
					break;
				case 'wtf':
					console.log('   wtf?  -'.red, message + ' \n \n   note: you fucked up, remember to breathe then check your shit! \n');
					break;
			}
		} else {
			switch(type){
				case 'e':
					console.log('   error -'.red, message);
					break;
				case 'w':
					console.log('   warn  -'.magenta, message);
					break;
				case 'i':
					console.log('   info  -'.cyan, message);
					break;
			}

			// log to aws
		}
	};

})();