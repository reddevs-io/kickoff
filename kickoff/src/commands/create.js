const {Command, flags} = require('@oclif/command')
const inquirer = require('inquirer')
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))
const chalk  = require('chalk')
const fs = require('fs')
const ncp = require('ncp').ncp
const path = require('path')

class CreateCommand extends Command {
  cleanAppName(appName) {
    return appName.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
  }

  printSuccessMessage(projectType, folderName) {
    this.log(chalk.green(`
        == CONGRATS ==
        Your ${projectType} project is ready for development!

        Now you can:
        1- cd ./${folderName}
        2- kickoff start
                        `))
  }

  generateProjectFiles(appName, appType) {
    let folderName = this.cleanAppName(appName)
    let templateFolder = path.join(__dirname, '/templates/', appType)

    fs.mkdir(folderName, err => {
      if (err) {
        return this.log("There was a problem creating your project's folder: " + chalk.red(err.toString()))
      }
      this.log('Folder - ' + chalk.bold(folderName) + ' -  ' + chalk.green('successfully created!'))
      ncp(templateFolder, path.join(folderName, '/.kickoff'), err => {
        if (err) {
          return this.log('There was a problem while copying your files: ' + chalk.red(err))
        }
        this.printSuccessMessage(appType, folderName)
      })
    })
  }

  async run() {
    let userInput = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Project type:',
        choices: ['symfony', 'drupal'],
      },
      {
        type: 'input',
        name: 'name',
        message: 'Application name:',
      },
    ])

    this.generateProjectFiles(userInput.name, userInput.type)
  }
}

CreateCommand.description = `Creates a project
...
Extra documentation goes here
`

CreateCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = CreateCommand
