var dao = require('./dao');
var fs = require('fs');
var filePath = __dirname + '/workflow_data.json';
var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getConfig(args){
	
	var ret = null;
	var matches, configs = obj.config;
	for (var i = 0; i < configs.length; i++) {
		matches = 0;
		
		for (var key in args){
			if (configs[i][key] && args[key] == configs[i][key]){
				++matches;
			}
		}
		
		if (matches == Object.keys(args).length){
			ret = configs[i];
			break;
		}
	}
	
	return ret;	
}

function getFlow(uuid, config_name, user){
	
	var ret = null,
		flows = getConfig({"name":config_name}).flow;

	for (var i = 0; i < flows.length; i++) {
		if (flows[i].uuid === uuid){
			for (var j = 0; j < user.roles.length; ++j){
				if (flows[i].roles.indexOf(user.roles[j])){
					ret = flows[i];
					break;					
				}
			}
		}		
	}
	return ret;	
}

function getNextNodes(from, config_name, user){
	
	var ret = [],
		flows = getConfig({"name":config_name}).flow;

	for (var i = 0; i < flows.length; i++) {
		if (flows[i].from == from) {
			for (var j = 0; j < user.roles.length; ++j){
				if (flows[i].roles.indexOf(user.roles[j]) != -1){
					ret.push(flows[i]);	
				}
			}
		}		
	}
	return ret;	
}

function followEdge(uuid, config_name, project_uuid, user){
	/* just hard coded to projects for now, in future would use the getConfig({name: config_name}).for to find the entity and then do a get on it
	* like /projects/uuid or users/uuid
	*/
	var project = dao.getProject(project_uuid, user);

	var flow = getFlow(uuid, config_name, user);
	var ret = false; 
	
	if (flow){

		project.state = flow.to;
		dao.saveProject(project, user);
		ret = true;
	} 
	
	return ret;
	
}

exports.getConfig = getConfig;
exports.followEdge = followEdge;
exports.getNextNodes = getNextNodes;