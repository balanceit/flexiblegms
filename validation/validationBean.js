var jsdom = require('jsdom');
var fs     = require('fs');
var purejs = fs.readFileSync(__dirname + "/../scripts/pure.js").toString();
var jquery = fs.readFileSync(__dirname + "/../scripts/jquery.js").toString();
var jqueryVal = fs.readFileSync(__dirname + "/../scripts/jquery.validate.js").toString();
var dao = require("../data/dao");



function validate(req, section_uuid, project_uuid, callback){
	
	var formData = req.body;
	var user = req.session.user;
	var ret = [];
	var project = dao.getProject(project_uuid, user);
	var ip_uuid = project.ip_uuid;
	
	var sectionData = dao.getSection(section_uuid, project_uuid, user);	
	console.log('returned from getSection ' + sectionData);
	var items = [];
	if (sectionData.data && sectionData.data.items){
		items = sectionData.data.items;
	}

	jsdom.env({
		html: '<form id="validate"></form>',
		src: [jquery,purejs,jqueryVal],
		done: function(errors, window) {

			var validate_options = {
					onkeyup: false,
					onfocusout: false,
		  	  	    errorClass:'error',
		  	  	    validClass:'',
		  	  	    errorElement:'span',
		  	  	    highlight: function (element, errorClass, validClass) { 
		  	  	        $(element).parents("div.clearfix").addClass(errorClass);
		  	  	    }, 
		  	  	    unhighlight: function (element, errorClass, validClass) { 
		  	  	        $(element).parents(".error").removeClass(errorClass); 
		  	  	    }
			};
	  		var $ = window.$;
			var itemHtml = '';
			var item_uuid = '';
			for (var i=0; i < items.length; ++i){
				item_uuid = 'item_' + items[i].uuid;

				itemHtml = '' ;
				switch (items[i].type){
						
					case 'textarea': 
						
						break;
					case 'textbox':
						itemHtml+='<div id="itemtemplate_'+items[i].uuid+'">';
						itemHtml+=dao.getItemTemplate(items[i].type, section_uuid, ip_uuid);
						itemHtml+='</div>';

						$('form').append(itemHtml);
						$('div#itemtemplate_'+items[i].uuid).render(items[i], 
																{
																	'div.clearfix label': 'title'
																	,'div.clearfix label@for': function(){return item_uuid;}
																	,'div.clearfix div *@id': function(){return item_uuid;}
																	,'div.clearfix div *@name': function(){return item_uuid;}
																	,'div.clearfix div *@class+': function(){return ' required email ';}
																});
						
						//the below would be in a different handler one for projects
						$('#item_'+items[i].uuid).render({},
																	{
																		'.@value': function() {return formData['item_'+items[i].uuid];}
																	});

				  	  	var validator = $('form').validate(validate_options);
				  	  	if (validator.form()){
							ret[item_uuid] = {};
							ret[item_uuid].isValid = true;
				  	  		
				  	  	} else {
							ret[item_uuid] = {};
							ret[item_uuid].isValid = false;
				  	  		
				  	  	}
						break;
					case 'dropdownlist':
						
						break;
				}
	
			}
			
			callback(ret);
			
		}
	});
	
	
}

exports.validate = validate;
