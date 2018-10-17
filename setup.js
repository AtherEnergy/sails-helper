var cpx = require('cpx');
var inquirer = require('inquirer');
var async = require('async');
var path = require('path');
var fs = require('fs');
// cpx.copySync('kue/controllers/*', '../../api/controllers');
// cpx.copySync('kue/views/**', '../../views');
// // cpx.copySync('kue/**', '../../api/');
// console.log('copied stuff');
async.series({
	installKue:function(callback){
		inquirer.prompt([
			{
				type: 'confirm',
				name: 'kue',
				message: 'Do you want to install Kue?',
			},
		]).then(answers => {
			if(answers.kue){
				// console.log(JSON.stringify(answers, null, '  '));
				var sails_folder = path.join(__dirname,'../../');
				// console.log(__dirname); // /Users/alex.jv/ec2code/alex/cashflowy/node_modules/sails-helper
				
				// console.log(sails_folder); // /Users/alex.jv/ec2code/alex/cashflowy/
				
				if (fs.existsSync(sails_folder+'api/controllers/KueController.js'))
				    console.log('KueController already exists. It will be over written.');

				cpx.copySync(__dirname+'/kue/controllers/*', sails_folder+'api/controllers');
				cpx.copySync(__dirname+'/kue/views/**', sails_folder+'views');
				if(fs.existsSync(sails_folder+'api/controllers/KueController.js') && fs.existsSync(sails_folder+'views/kue/index.ejs')){
					console.log("Kue installation successful \
						\nOnly controllers and views are setup. \
						\nYou will need to define the routes and policies manually.\
						\n\
						\n### Add this to routes.js ###\
						\n'GET /kue':'KueController.index',\
						\n'GET /kue/:state':'KueController.listItemsInKue',\
						\n'POST /kue/retry':'KueController.retryJob',\
						\n'POST /kue/delete':'KueController.deleteJob',\
						\n\
						\n### Update policy.js ###\
						\nKueController:{\
						\n  '*':['isAuthenticated','isAdmin']\
						\n},\
						\n\
						\nThis assumes that you have 'isAdmin' policy and 'isAuthenticated' policy defined.\
					");


				}else{
					console.log('kue installation failed');
				}

				
				callback(null);
			}
		});
	},
	installSomethingElse:function(callback){
		inquirer.prompt([
			{
				type: 'confirm',
				name: 'slack_service',
				message: 'Do you want to install slack service?',
			},
		]).then(answers => {
			if(answers.somthing){
				console.log(JSON.stringify(answers, null, '  '));
				// cpx.copySync('kue/controllers/*', '../../api/controllers');
				// cpx.copySync('kue/views/**', '../../views');
				callback(null);
			}
		});
	}

},function(err,results){
	console.log("everything done");
})