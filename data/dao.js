var fs = require('fs');
var path = require('path');
//var $ = require('jQuery');
var jsdom = require('jsdom');
var workflowDao = require(__dirname + "/workflow");

var filePath = __dirname + '/data.json';
var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

var projectfilePath = path.normalize('./project_data.json');
var pobj = JSON.parse(fs.readFileSync(projectfilePath, 'utf8'));
fs.writeFileSync(projectfilePath, JSON.stringify(pobj), encoding='utf8');


function authenticate(login, password, callback){
	var user = users[login];
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


function getAllIPs(callback) {
	  console.log("getting the data for all ips" );
	  //var filePath = '../data/data.json';
	  //var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	  console.log('returning from getAllIps ' + obj.ips.length)
	  return obj.ips;
}

function getIP(ip_uuid,callback) {
	  ////console.log("getting the data for the ip: [" + ip_uuid + "]");
	  var ips = getAllIPs(callback);
	  var ret = {};

	  for (var i = 0; i < ips.length; i++) {
		  ////console.log('comparing ['+obj[i].uuid+'] with ' + ip_uuid);
		  if (ips[i].uuid === ip_uuid){
			  ret = ips[i];
			  break;
		  }
	  }
	  ////console.log('returning from getIP ' + ret.length)
	  return ret;
}

function getAllSections(ip_uuid,callback) {
	  console.log("getting the data for all sections for the ip: " + ip_uuid );
	  //var filePath = '../data/data.json';
	  var ret = [];
	  //var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	  for (var i = 0; i < obj.sections.length; i++) {
		  ////console.log('comparing ['+obj.sections[i].ip_uuid+'] with ' + ip_uuid);
		  if (obj.sections[i].ip_uuid === ip_uuid){
			  ////console.log('pushing ' + obj.sections[i])
			  ret.push(obj.sections[i]);
		  }
	  }
	  ////console.log('returning from getAllSections ' + ret.length)
	  return ret;
}

function getItem(ip_uuid,section_uuid,item_uuid,callback) {
	  var project_uuid = ip_uuid;
	  var project = getProject(project_uuid);
	  var ret = project.data[item_uuid];
	  //var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	  
	  console.log('returning from getitem ' + item_uuid)
	  return ret;
}


function getSection(section_uuid, project_uuid, user, callback) {
  var ret = {};
  var project = getProject(project_uuid, user);
  if (!project){return ret;}
	  
  var sections = getAllSections(project.ip_uuid);

  for (var i = 0; i < sections.length; i++) {
	  ////console.log('comparing ['+obj[i].uuid+'] with ' + section_uuid);
	  if (sections[i].uuid === section_uuid){
		  ret = sections[i];
		  break;
	  }
  }
  ////console.log('after the compare loop: i=[' + i + "] ret obj=[" + JSON.stringify(ret) + "] obj:[" + JSON.stringify(obj.sections) + "]");
  if (i == sections.length){
	  ret.nextUrl = sections[0].uuid;
	  ret.backUrl = sections[--i].uuid;
	  ret.nextText = 'next &raquo;'; 
	  ret.backText = '&laquo; back'; 
  } else {
	  if (i == 0){
		  ret.backUrl = '/projects/' + project_uuid + '/sections/main'; 
		  ret.backText = '&nbsp;home&nbsp;';
	  } else {
		  ret.backUrl = '/projects/' + project_uuid + '/sections/' + sections[i-1].uuid; 
		  ret.backText = '&laquo; back';		  
	  }
	  
	  if (++i < sections.length){
		  ret.nextUrl = '/projects/' + project_uuid + '/sections/' + sections[i].uuid;
		  ret.nextText = 'next &raquo;'; 
	  } else {
		  ret.nextUrl = '/projects/' + project_uuid + '/sections/main';
		  ret.nextText = '&nbsp;home&nbsp;'; 
	  }
  }
  //console.log('returning from getSection' + JSON.stringify(ret));
  
  return ret;
}


function getItemTemplate(item, section_uuid, ip_uuid, callback) {
//	//console.log("getting the data for the item [" + item + "]");
	//var filePath = '../data/data.json';
	//var obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	
	var ret = '';

//	//console.log('\n\nnow this is the obj.item_def for item [' + item + '] -- ' + JSON.stringify(obj.item_def));
	
	if (obj.item_def[item]){
		ret = fs.readFileSync(path.normalize(__dirname + '/../' + obj.item_def[item]), 'utf8');

	}

//	//console.log("\n\nreturning from the getItem method [" + ret + "]");
	return ret;
}

function loadTemplate(pathname, callback) {
  var filePath = pathname;
  var contents = '';
  console.log('loading template for the template: ' + pathname);
  path.exists(filePath, function(exists) {
  	
  	if (exists) {
  		fs.readFile(filePath, 'utf8', function(error, content) {
  			if (error) {
  			    console.log("template not found." + error);
  			    callback(error, null);
  			}
  			else {
  			    contents = content.replace(/(\r\n|\n|\r|\t+)/gm,"");
  			    console.log("calling callback ----" )
  			    callback(null, contents);
  			    //callback('<div id="template"><div class="hello"><span class="who"></span></div></div>');
  			}
  		});
  	}
  	else {
  		console.log('path ' + filePath + ' does not exist.');
  		callback(error, null);
  	}
  });

}

function getProjects(user){

	var args = {};
	args.agency_uuid = user.agency_uuid;
	if (user.applicant_uuid){
		args.applicant_uuid = user.applicant_uuid;
	}
	

  return getAllProjects(args);
	
}

function getAllProjects(args){
	args = args || {};

	var ret = [];

	for (var i = 0; i < pobj.projects.length; i++) {
		matches = 0;
		for (var key in args){

			if (pobj.projects[i][key] && args[key] == pobj.projects[i][key]){
				++matches;
			}
		}
		
		if (matches == Object.keys(args).length){
			ret.push(pobj.projects[i]);
		}
	}
  return ret;
	
}

function getProject(project_uuid, user){
	  //console.log("getting the data for the project: " + project_uuid );
	  var ret = null;
	  var projects = getProjects(user);
	  for (var i = 0; i < projects.length; i++) {
		  //console.log('comparing ['+projects[i].uuid+'] with ' + project_uuid);
		  if (projects[i].uuid === project_uuid){
			  ret = projects[i];
			  break;
		  }
	  }
	  //console.log('returning from getProject ' + JSON.stringify(ret));
	  return ret;	
}

function saveProject(project, user){
	
	  var projects = getAllProjects();
	  for (var i = 0; i < projects.length; i++) {
		  if (projects[i].uuid === project.uuid){

			  project.modifiedby = user.uuid;
			  project.modifiedon = new Date();
			  projects[i] = project;
			  break;
		  }
	  }
	  pobj.projects = projects;
 
	  fs.writeFileSync(projectfilePath, JSON.stringify(pobj), encoding='utf8');
	 	  
	  //console.log('saved the project ' + JSON.stringify(project));	
	
}

function createProject(ip_uuid, projecttitle, user, callback){

	  var projects = getAllProjects();
	  var project = {};
	  var ip = getIP(ip_uuid);
	  var startnode = workflowDao.getConfig({name:ip.workflow}).start.node; 	  
	  
	  console.log('startnode for ip %s is %s', ip.shortName, startnode);
	  
	  project.state = startnode;
	  project.uuid = String(projects.length + 1);
	  project.ip_uuid = ip_uuid;
	  project.name = projecttitle;
	  project.data = {};
	  project.errors = {};
	  project.applicant_uuid = user.applicant_uuid || user.agency_uuid;
	  project.agency_uuid = user.agency_uuid;
	  project.createdby = user.uuid;
	  project.modifiedby = user.uuid;
	  project.createdon = new Date();
	  project.modifiedon = new Date();
	  
	  projects[projects.length] = project;
	  
	  pobj.projects = projects;

	  fs.writeFileSync(projectfilePath, JSON.stringify(pobj), encoding='utf8');
	 	  
	  callback(project);
	
}


exports.getIP = getIP;
exports.getAllIPs = getAllIPs
exports.getSection = getSection;
exports.getAllSections = getAllSections;
exports.getItemTemplate = getItemTemplate;
exports.loadTemplate = loadTemplate;
exports.getProjects = getProjects;
exports.saveProject = saveProject;
exports.getProject = getProject
exports.getItem = getItem;
exports.createProject = createProject;