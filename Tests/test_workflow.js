var fs = require('fs');

var filePath = __dirname + '/user_data.json';
var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function authenticate(login, password, callback){
	var user = getUser({login: login});
	if (!user){
		callback(null);
		return;
	}
	if (user.password == password){
		callback(user);
		return;
	}
	callback(null);
}


/* example 
 * getUser({name: 'bob', type: 'person'}
 */
function getUser(args){
	
	var ret = null;
	var matches, users = obj.ldap;
	for (var i = 0; i < users.length; i++) {
		matches = 0;
		
		for (var key in args){
			if (users[i][key] && args[key] == users[i][key]){
				++matches;
			}
		}
		
		if (matches == Object.keys(args).length){
			ret = users[i];
			break;
		}
	}
	
	return ret;	
}

function getRole(name){
	
	var ret = null,
		roles = obj.roles;
	
	for (var i = 0; i < roles.length; i++) {
		if (roles[i].name == name){
			ret = roles[i];
			break;
		}		
	}
	return ret;	
}

function getUsersAccess(user){
	
	var urls = [];
	for (var i = 0; i < user.roles.length; i++){

		urls = urls.concat(getRole(user.roles[i]).access);
	} 

	return subUrlVar(user, urls.unique());	
}

function subUrlVar(user, urls){

	for (var i = 0; i < urls.length; i++){
		urls[i] = urls[i].replace(/:uuid/gi, user.uuid);
	} 
	
	return urls;
	
}

function canUserAccess(user, url){
	
	var urls = getUsersAccess(user);
	var ret = false;
	var pattern, match;
	
	for (var i = 0; i < urls.length; i++){
		pattern = new RegExp('^' + urls[i].replace(/\//g, '\\/'),'i');

		match = url.match(pattern); 
		if (match && match[0] === url){
			ret = true;
			break;
		}
		
	}
	
	return ret;	
}

exports.authenticate = authenticate;
exports.canUserAccess = canUserAccess;
exports.getUser = getUser;