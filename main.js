var express = require('express');
var requestHandlers = require("./requestHandlers");
var dao = require("./data/dao");
var userDao = require("./data/user");
var workflowDao = require("./data/workflow");
var fs = require('fs');
var https = require('https');
var http = require('http');

var port = 13539;
var sslport = 13539;

var count = 0;

var app = express.createServer();
var options = {
		  key: fs.readFileSync('./certs/webserver.nopass.key'),
		  cert: fs.readFileSync('./certs/newcert.pem')
		};


app.use(express.bodyParser());
app.use(express.cookieParser());
//app.use(express.logger());
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
app.use(express.session({ secret: 'somekey'}));

app.use("/scripts", express.static(__dirname + '/scripts'));
app.use("/less", express.static(__dirname + '/less'));
app.use("/images", express.static(__dirname + '/images'));

app.use(express.static(__dirname));

http.createServer(app.handle.bind(app)).listen(port);
//https.createServer(options,app.handle.bind(app)).listen(sslport);

/*some middleware
 *  restrict will just ensure that the user is logged in on the routes where
 *  the need to be
 */
function restrict(req, res, next){

	if (req.session.user) {
		next();
	} else {
		//res.redirect('https://localhost:' + sslport + '/sessions/new?rd=' + req.url);
		res.redirect('http://localhost:' + sslport + '/sessions/new?rd=' + req.url);
	}
}
/*some more middleware
 *  access will check the users role
 *
 *  first, the url you are attempting to access is checked against the users roles access list
 *  	if the users role can access the current role
 *  		(ex: with role.access = [/ips", "/projects", "/projects/*", "/users/:uuid/*]
 *  				when: req.url === '/projects
 *  					access === true
 *  				when: req.url === '/users/123 && user.uuid === '123'
 *  					access === true
 *  				when: req.url === '/users/333 && user.uuid === '123'
 *  					access === false
 *			
 */
function access(req, res, next){
	if (userDao.canUserAccess(req.session.user, req.url)){
		next();
	} else {
		requestHandlers._404(res, req);
	}	
	
}



app.get('/sessions/new', function(req, res){
	console.log(++count + ' GET: ' + req.url);
	requestHandlers.login(res, req);
});

app.post('/sessions', function(req, res){
	//console.log(req.body);
	//console.log(++count + ' POST: ' + req.url + ' ' + req.body.session.password + ' ' + req.body.session.login);
	userDao.authenticate(req.body.session.login, req.body.session.password, function(user){
		console.log(user);
		if (user){

			req.session.user = user;
			if (req.header('Accept') == 'application/json'){
				res.send('ok');
			} else {
				res.redirect(req.body.rd ? 'http://localhost:' + port + req.body.rd : 'http://localhost:' + port + '/projects');
			}
			
		} else {

			if (req.header('Accept') == 'application/json'){
				res.writeHead(403, {"Content-Type": "application/json"});
				res.end('Forbidden');
			} else {
				//res.redirect('https://localhost:' + sslport + '/sessions/new?rd=' + req.body.rd);
				res.redirect('http://localhost:' + sslport + '/sessions/new?rd=' + req.body.rd);
			}
			
		}
	});
	
});

app.get('/sessions/destroy', function(req, res){
	console.log(++count + "GET: " + req.url);
	
	delete req.session.user;
	//res.redirect('https://localhost:' + sslport + '/sessions/new');
	res.redirect('http://localhost:' + sslport + '/sessions/new');
});

app.get('/ips', function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.ips(res, req);	
});

app.get('/ips/:ip_uuid', restrict, access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.ip(res, req);	
});

app.get('/ips/:ip_uuid/sections', restrict, access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.sections(res, req);	
});

app.get('/ips/:ip_uuid/project', restrict, access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.startProject(res, req);	
});

app.post('/ips/:ip_uuid/project', restrict, access, function(req, res){
	console.log(++count + "POST: " + req.url);
	requestHandlers.createProject(res, req);	
});

app.get('/ips/:ip_uuid/sections/:section_uuid', restrict, access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.section(res, req);	
});

app.get('/projects/:project_uuid/sections/:section_uuid', restrict, access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.section(res, req);	
});

app.post('/projects/:project_uuid/sections/:section_uuid', restrict,  access, function(req, res){
	console.log(++count + "POST: " + req.url);
	console.log('=================================================');
	console.log(req.header('Accept'));
	console.log('=================================================');
	requestHandlers.saveSection(res, req);
	if (req.header('Accept') == 'application/json'){
		res.send('ok');
	} else {
		requestHandlers.section(res, req, false);
	}
});

app.post('/projects/:project_uuid/nodes', restrict,  access, function(req, res){
	console.log(++count + "POST: " + req.url);
	//would do some more validation to see if the edge can be transversed and if the node exists
	console.log(req.body);
	var user = req.session.user;
	var project = dao.getProject(req.params.project_uuid, user);
	console.log(project);
	workflowDao.followEdge(req.body.flow_uuid, 'application process', project.uuid, user);

	if (req.header('Accept') == 'application/json'){
		res.send('ok');
	} else {
		res.redirect('back');
	}
});

app.get('/projects', restrict,  access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.projects(res, req);	
});

app.get('/projects/:project_uuid', restrict,  access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.project(res, req);	
});

app.get('/projects/edges/:edge_name', restrict,  access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.edge(res, req);	
});

app.get('/projects/edges', restrict,  access, function(req, res){
	console.log(++count + "GET: " + req.url);
	requestHandlers.edges(res, req);	
});

app.error(function(err, req, res){
	console.log('---------------------------------------------------------------------------');
	throw(err);
});


Array.prototype.unique = function() {
    var a = [], l = this.length;
    for(var i=0; i<l; i++) {
        for(var j=i+1; j<l; j++)
            if (this[i] === this[j]) j = ++i;
        a.push(this[i]);
    }
    return a;
};