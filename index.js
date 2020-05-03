#!/usr/bin/env node

// Los imports
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const shell = require('shelljs');
const chalk = require('chalk');

// Obtener las opciones de los templates
const TEMPLATE_OPTIONS = fs.readdirSync(path.resolve(__dirname, 'templates'));

const QUESTIONS = [
	{
		name: 'template',
		type: 'list',
		message: '¿Que tipo de proyecto quieres generar?',
		choices: TEMPLATE_OPTIONS
	},
	{
		name: 'proyecto',
		type: 'input',
		message: '¿Cual es el nombre del proyecto',
		validate: function (input) {
			if (/^([a-z@]{1}[a-z\-\\.\\\/0-9]{0,213})+$/.test(input)) {
				return true;
			}
			return 'El nombre del proyecto solo puede tener 214 caracteres y tienes que empezae en miniscula o con un @';
		}
	}
];

const DIR_ACTUAL = process.cwd();
inquirer.prompt(QUESTIONS).then((resp) => {
	console.log(resp);
	const template = resp['template'];
	const proyecto = resp['proyecto'];

	const templatePath = path.resolve(__dirname, 'templates', template);
	const pathTarget = path.resolve(DIR_ACTUAL, proyecto);
	if (!createProject(pathTarget)) return false;
	createDirectoriesFilesContent(templatePath, proyecto);
	postProccess(templatePath, pathTarget);
});

function createProject(projectPath) {
	// Comprobar que no existe el directorio
	if (fs.existsSync(projectPath)) {
		console.log(
			chalk.red(
				'No puedes crear el proyecto porque ya existe, intenta con otro'
			)
		);
		return false;
	}

	fs.mkdirSync(projectPath);
	return true;
}

function createDirectoriesFilesContent(templatePath, projectName) {
	const listFileDirectories = fs.readdirSync(templatePath);
	listFileDirectories.forEach((item) => {
		const originalPath = path.resolve(templatePath, item);

		const stats = fs.statSync(originalPath);
		const writePath = path.resolve(DIR_ACTUAL, projectName, item);

		if (stats.isFile()) {
			let content = fs.readFileSync(originalPath, 'utf-8');
			fs.writeFileSync(writePath, content, 'utf-8');
			// Informacion addicional
			const CREATE = chalk.green('CREATE ');
			const size = stats['size'];
			console.log(`${CREATE} ${originalPath} (${size} bytes)`);
		} else if (stats.isDirectory()) {
			fs.mkdirSync(writePath);
			createDirectoriesFilesContent(
				path.resolve(templatePath, item),
				path.resolve(projectName, item)
			);
		}
	});
}

function postProccess(templatePath, targetPath) {
	const isNode = fs.existsSync(path.resolve(templatePath, 'package.json'));

	if (isNode) {
		shell.cd(targetPath);
		console.log(chalk.green(`Instalando las dependencia en ${targetPath}`));
		const result = shell.exec('npm install');
		if (result.code != 0) {
			return false;
		}
	}
}
