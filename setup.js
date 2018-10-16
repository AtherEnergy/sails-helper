var cpx = require('cpx');
var inquirer = require('inquirer');
var async = require('async');

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
				console.log(JSON.stringify(answers, null, '  '));
				cpx.copySync('kue/controllers/*', '../../api/controllers');
				cpx.copySync('kue/views/**', '../../views');
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