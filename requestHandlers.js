var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var dao = require("./data/dao");
var userDao = require("./data/user");
var workflowDao = require("./data/workflow");
var jquery = fs.readFileSync(__dirname + "/scripts/jquery.js").toString();
var purejs = fs.readFileSync(__dirname + "/scripts/pure.js").toString();
var fs     = require('fs');
var vb     = require('./validation/validationBean');

function sections(response, postData) {

	var data = dao.getAllSections(postData.params.ip_uuid);
	response.send(JSON.stringify(data));
}

function item(response, postData) {
	var data = dao.getItem(postData.params.ip_uuid, postData.params.section_uuid, postData.params.item_uuid);
	response.send(JSON.stringify(data));
}

function project(response, postData) {
	var project = dao.getProject(postData.params.project_uuid, postData.session.user);

	if (!project){
		_404(response, postData);
		return false;
	}

	postData.params.ip_uuid = project.ip_uuid;
	postData.params.section_uuid = 'main';
	section(response, postData);
	
	
}

function createProject(response, postData) {
	dao.createProject(postData.params.ip_uuid, postData.body.projecttitle, postData.session.user, function(project){
		response.redirect('/projects/' + project.uuid + '/sections/main');
	});	
}


function login(response, postData) {

	var data = {},
		directive    = {'#rd@value': 'url'};
	
	data.url = postData.query.rd || '/projects';
	
	
	dao.loadTemplate('./templates/login.html', function(buffer){
		jsdom.env({
			html: buffer,
			src: [jquery,purejs],
			done: function(errors, window) {
			  		var $ = window.$;
		  			$('div#template').render(data, directive);
		  			response.send(window.document.innerHTML);
		  		}
		});
	});	
}


function authenticate(response, postData){
	
}

function ips(response, postData) {
	////console.log("Request handler 'ips'");
	var data = dao.getAllIPs();
	var directive     = {'#title':function(arg){return 'Investment processes'}
					,'#detail': function(agr){return 'Please perruse the below investment processes and choose the one which is most likely to get you money. If you find one to your liking please click on the \'apply\' button.';}
					,'div#ip_container': {
						'ip<-': {
							'h2':'ip.shortName'
							,'p#ipdetails':'ip.data.content'
							,'a#apply@href': function (arg){return 'ips/' + arg.item.uuid +'/project';}
							,'a#info@data-controls-modal': function(arg){return 'ip_modal_' + arg.item.uuid;}
							,'@id': function (arg){return 'ip_container_' + arg.item.uuid;}
						}
					}
					,'div#modal-from-dom': {
						'ip<-': {
							'h3':'ip.name'
							,'p#modal_body': function (arg){return JSON.stringify(arg.item);}
							,'@id': function(arg){return 'ip_modal_' + arg.item.uuid;}
						}
					}
				};	
	
	dao.loadTemplate('./templates/iplist.html', function(buffer){
		////console.log('template iplist loaded');
		
		jsdom.env({
			html: buffer,
			src: [jquery,purejs],
			done: function(errors, window) {
			  		var $ = window.$;
		  			$('div#template').render(data, directive);
		  			response.send(window.document.innerHTML);
		  		}
		});
		
		
	});
}

function ip(response, postData) {
	var data = dao.getIP(postData.params.ip_uuid);
	response.send(JSON.stringify(data));
}

function saveSection(response, postData) {
	var project = dao.getProject(postData.params.project_uuid, postData.session.user);

	var project_uuid = project.uuid;
	var section_uuid = postData.params.section_uuid;

	var sectionData = dao.getSection(section_uuid, project_uuid, postData.session.user);	

	var items = [];
	if (sectionData.data && sectionData.data.items){
		items = sectionData.data.items;
	}	

	vb.validate(postData, section_uuid, project_uuid, function(errors){
			project.data[item_uuid] = postData.body[item_uuid];


			var item_uuid = '';
			for (var i=0; i < items.length; ++i){
				item_uuid = 'item_'+items[i].uuid;
				if (postData.body[item_uuid]){

					if (!errors[item_uuid] || errors[item_uuid].valid){
						project.data[item_uuid] = postData.body[item_uuid];

						if (project.errors && project.errors[item_uuid]){
							delete project.errors[item_uuid];
						}
						
					} else {
						if (!project.errors){
							project.errors = {};
						}
						project.errors[item_uuid] = postData.body[item_uuid];
					}
				
				}
			}

			dao.saveProject(project, postData.session.user);
	});
	
}

function section(response, postData, clean) {

	var user = postData.session.user;
	var project_uuid = postData.params.project_uuid;
	var project = dao.getProject(project_uuid, user);

	if (!project){
		_404(response, postData);
		return false;
	}
	
	var ip_uuid = project.ip_uuid;
	var section_uuid = postData.params.section_uuid;
	//console.log("Request handler 'section' was called with section " + section_uuid);

	var data = dao.getAllSections(ip_uuid);
	//console.log('returned from getAllSections for ip_uuid 0001 ' + JSON.stringify(data));
	
	console.log(project_uuid);
	var sectionData = dao.getSection(section_uuid, project_uuid, postData.session.user);

	//console.log('returned from getSection ' + sectionData);
	var items = [];
	if (sectionData.data && sectionData.data.items){
		items = sectionData.data.items;
	}	
	
	var sectionContentDirective = {'h1': 'section'
							,'a#next_section@href':function(arg){
										return arg.context.nextUrl;
									}
							,'a#next_section': function(arg){
										return arg.context.nextText;
									}
							,'a#previous_section@href':function(arg){
								return arg.context.backUrl;
							}
							,'a#previous_section': function(arg){
								return arg.context.backText;
							}
	},
	directive     = {'li#templatelist':{
		  'section<-':{
			   //'a.section':'section.section',
			   'a':function(arg){ return arg.item.section},
			   'a@href':function(arg){
				   return '/projects/' + project_uuid + '/sections/'+arg.item.uuid;
			   },
			   'a@style+':function(arg){
				   if (arg.item.uuid === section_uuid){
					   return 'font-weight:bold';
				   } else {
					   return '';					   
				   }
			   }
			  }
			 },
			 'h5':function(){return 'Sections';}
			};

	dao.loadTemplate('./templates/wrapper.html', function(buffer){

		jsdom.env({
			html: buffer,
			src: [jquery,purejs],
			done: function(errors, window) {
			  		var $ = window.$;
			  		

					dao.loadTemplate('./templates/list.html', function(buffer){
						
						$('div#sectionlist').append(buffer);
						
						var itemHtml = '';
						if (sectionData.data && sectionData.data.content){
							//itemHtml = sectionData.data.content + "<br/><hr/>";

							for (var i=0; i < items.length; ++i){
								itemHtml = '';
								itemHtml+='<div id="itemtemplate_'+items[i].uuid+'">';
								itemHtml+=dao.getItemTemplate(items[i].type, section_uuid, ip_uuid);
								itemHtml+='</div>';
								$('div#mainContent').append(itemHtml);
								//itemDirective = {};
								switch (items[i].type){
								case 'textarea': 

									$('div#itemtemplate_'+items[i].uuid).render(items[i], 
																			{
																				'div.clearfix label': 'title'
																				,'div.clearfix label@for': function(){return 'item_' + items[i].uuid;}
																				,'div.input *@id': function(){return 'item_' + items[i].uuid;}
																				,'div.input *@name': function(){return 'item_' + items[i].uuid;}
																			});
									$('#item_'+items[i].uuid).render({},
											{
												'.': function() {return project.data['item_'+items[i].uuid];}
											});
									break;
								case 'textbox':
									$('div#itemtemplate_'+items[i].uuid).render(items[i], 
																			{
																				'div.clearfix label': 'title'
																				,'div.clearfix label@for': function(){return 'item_' + items[i].uuid;}
																				,'div.input *@id': function(){return 'item_' + items[i].uuid;}
																				,'div.input *@name': function(){return 'item_' + items[i].uuid;}
																				,'div.input *@class+': function(){return ' required email ';}
																			});
									
									//the below would be in a different handler one for projects
									$('#item_'+items[i].uuid).render({},
																				{
																					'.@value': function() {
																						var ret = {};
																						if (clean && project.errors['item_'+items[i].uuid]){
																							delete project.errors['item_'+items[i].uuid];
																						} 
																						if (project.errors && project.errors['item_'+items[i].uuid]){
																							ret = project.errors['item_'+items[i].uuid];
																						} else {
																							ret = project.data['item_'+items[i].uuid];
																						}
									
																						return ret;
																					}
																				});
									break;
								case 'dropdownlist':
									$('div#itemtemplate_'+items[i].uuid).render(items[i], 
																				{
																					'div.clearfix label': 'title'
																					,'div.clearfix label@for': function(){return 'item_' + items[i].uuid;}
																					,'div.input *@id': function(){return 'item_' + items[i].uuid;}
																					,'div.input *@name': function(){return 'item_' + items[i].uuid;}
																				});
										
									break;
								}
				
							}
						} else {
							itemHtml = "<p>Welcome</p>";
							
						}
							
						$('div#contentTemplate').render(sectionData, sectionContentDirective);
						$('div#sectionlist').render(data, directive);

						$('#projectinfo h5').render(project, {'.': 'state'})

						var flows = workflowDao.getNextNodes(project.state, 'application process', user);
						console.log('=============================');
						console.log(flows);
						console.log('=============================');
						if (flows.length > 0){
							dao.loadTemplate('./templates/dropdownlist.html', function(buffer){
	
								var html = '';
								html+='<form id="followedge" name="followedge" method="post" action="/projects/'+project.uuid+'/nodes"></form>';
								$('#projectinfo').append(html);
								$('#followedge').append(buffer);
								$('#followedge').append('<input type="submit" class="btn">');
								
								var nodesDirective = {'option':{
									  'node<-':{
										   '.': 'node.via',
										   '.@value': 'node.uuid'
										}
									}
								};

								$('#followedge').render(flows, nodesDirective)
												.render({"name":"flow_uuid"},{'select@id':'name','select@name':'name'});
								

								console.log('in in iffff........');
					  			response.send(window.document.innerHTML);
							});
						} else {
							console.log('in else........');
				  			response.send(window.document.innerHTML);							
						}
					});
			  		
		  		}
		});
	});
}


function projects(response, postData) {

	var user = postData.session.user;
	
	var data = dao.getProjects(user),
	headerDirective     = {'th':{'column<-':{'.':'column'}}}
	projectDirective    = {'tbody tr':{
								'project<-':{
									'.':function(arg){
										var ip = dao.getIP(arg.item.ip_uuid);
										var ret = '<td><a href="'+postData.url+'/'+arg.item.uuid+'/sections/main">'+arg.item.uuid+'</a></td><td>'+ip.shortName+'</td><td>'+arg.item.name+'</td><td>'+arg.item.state+'</td><td>'+ (arg.item.createdon ? new Date(arg.item.createdon).toLocaleDateString() : '') + '</td><td>'+ (arg.item.createdby ? userDao.getUser({uuid:arg.item.createdby}).name : '') + '</td>';
										return ret ;}
									}
								}
							};

	var columns = ['reference','ip name','name', 'state', 'createdon', 'createdby'];
	var projectData = {};
	projectData.columns = columns;
	projectData.projects = data;

	dao.loadTemplate('./templates/projectListWrapper.html', function(buffer){

		jsdom.env({
			html: buffer,
			src: [jquery,purejs],
			done: function(errors, window) {
			  		var $ = window.$;
					
					dao.loadTemplate('./templates/datatable.html', function(buffer){
						$('div#template').append(buffer);
						$('#user').render(postData.session.user, {'.': 'name'});
			  			$('table#datatable').render(columns, headerDirective)
			  									.render(data, projectDirective);
			  			response.send(window.document.innerHTML);
					});
			}
		});
	});
}


function startProject(response, postData) {
	var data = dao.getIP(postData.params.ip_uuid),
	directive = {
		'#cancel@href':function(arg){
			return '/ips';
		}
		,'h2':'shortName'
		,'p#ipdetails':'data.content'
		,'#title':function(arg){return 'Investment processes';}
		,'#detail': function(agr){return 'Please perruse the below investment processes and choose the one which is most likely to get you money. If you find one to your liking please click on the \'apply\' button.';}
		
	};


	dao.loadTemplate('./templates/startproject.html', function(buffer){

		jsdom.env({
			html: buffer,
			src: [jquery,purejs],
			done: function(errors, window) {
			  		var $ = window.$;
					$('#user').render(postData.session.user, {'.': 'name'});
		  			$('div.container').render(data, directive);
					response.send(window.document.innerHTML);
			}
		});
	});
}


function _404(response, postData, pathname, sectionName) {
	//console.log("Request handler '_404' was called. for the url " + pathname );	
	response.writeHead(404, {"Content-Type": "text/html"});
	response.write('these are not the pages you are looking for......');
	response.end();

}
function _503(response, postData, pathname, error) {
	// Called when an exception is thrown by another router function
	// The error that caused the exception is passed as the third parameter
	// This _not_ guarranteed to catch all exceptions
	//console.log("Request handler '_503' was called. for the url " + pathname );	
	response.writeHead(503, {"Content-Type": "text/html"});
	response.write('dave, what are you doing dave........');
	//console.log(error);
	response.end();
}


exports.login = login;
exports.createProject = createProject;
exports.ips = ips;
exports.ip = ip;
exports.startProject = startProject
exports.item = item;
exports.sections = sections;
exports.section = section;
exports.saveSection = saveSection;
exports.project = project;
exports.projects = projects;
exports._404 = _404;
exports._503 = _503;
