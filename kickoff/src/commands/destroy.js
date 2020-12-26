const {Command, flags} = require('@oclif/command')
const chalk  = require('chalk')
const {exec} = require('child_process')
const inquirer = require('inquirer')

class DestroyCommand extends Command {
  async confirm() {
    return inquirer
    .prompt([
      {
        name: 'confirmDestroy',
        type: 'confirm',
        message: chalk.red('This command will delete all the project volumes ! ') + 'Are you sure ?',
      },
    ])
  }

  async run() {
    let userInput = await this.confirm()
    if (userInput.confirmDestroy) {
      this.log(chalk.cyan('Destroying project docker services...'))
      exec('docker-compose down --volumes', (err, stdout, stderr) => {
        if (err || stderr) {
          this.log(chalk.red(err))
          this.log(chalk.red(stderr))
          return
        }

        this.log(stdout)
      })
    }
  }
}

DestroyCommand.description = `Describe the command here
...
Extra documentation goes here
`

DestroyCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = DestroyCommand
