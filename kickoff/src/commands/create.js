const {Command, flags} = require('@oclif/command')
const inquirer = require('inquirer')
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))
const chalk  = require('chalk')
const fs = require('fs')
const ncp = require('ncp').ncp
const path = require('path')
const yaml = require('js-yaml')

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

  generateProjectFiles(userInput) {
    let appName = userInput.name
    let appType = userInput.type
    // let phpVersion = userInput.php
    let additionalServices = userInput.services

    let folderName = this.cleanAppName(appName)
    let templateFolder = path.join(__dirname, '/templates/', appType)

    fs.mkdir(folderName, err => {
      if (err) {
        return this.log("There was a problem creating your project's folder: " + chalk.red(err.toString()))
      }
      this.log('Folder - ' + chalk.bold(folderName) + ' -  ' + chalk.green('successfully created!'))
      // Copy nginx & PHP ini files
      ncp(templateFolder, path.join(folderName, '/.kickoff'), err => {
        if (err) {
          return this.log('There was a problem while copying your files: ' + chalk.red(err))
        }
      })
    })

    let dockerCompose = this.getDockerComposeJson(folderName, additionalServices)

    fs.writeFile(folderName + '/docker-compose.yml', yaml.safeDump(dockerCompose), 'utf8', err => {
      if (err) {
        return this.log('There was a problem while generating the docker-compose.yaml file: ' + chalk.red(err))
      }
    })
  }

  getDockerComposeJson(appName, additionalServices) {
    let dockerCompose = {
      version: '3',
      services: {
        nginx: {
          image: 'nginx:1.18-alpine',
          // eslint-disable-next-line camelcase
          container_name: appName + '_nginx',
          labels: [
            'traefik.enable=true',
            'traefik.http.services.nginx.loadbalancer.server.port=80',
            'traefik.http.routers.nginx.rule=Host(`' + appName + '.kickoff.test`)',
            'traefik.http.routers.nginx.tls=true',
          ],
          expose: [
            '80',
          ],
          networks: [
            'kickoff-proxy',
          ],
          volumes: [
            '.kickoff/nginx/nginx.conf:/etc/nginx/nginx.conf',
            '.kickoff/nginx/servers:/etc/nginx/conf.d',
            './.logs/nginx:/var/log/nginx',
            '.:/app:ro',
          ],
          // eslint-disable-next-line camelcase
          depends_on: [
            'php',
          ],
          restart: 'always',
        },
        php: {
          build: {
            context: './.kickoff/php',
          },
          // eslint-disable-next-line camelcase
          container_name: appName + '_php',
          environment: {
            XDEBUG_CONFIG: 'remote_host=host.docker.internal',
          },
          volumes: [
            '.:/app',
            '.kickoff/php/dev.ini:/usr/local/etc/php/conf.d/dev.ini',
          ],
          restart: 'always',
        },
      },
      networks: {
        'kickoff-proxy': {
          external: {
            name: 'kickoff-proxy',
          },
        },
      },
    }

    if (additionalServices.includes('database')) {
      dockerCompose.services.database = {
        image: 'mariadb:10.5',
        // eslint-disable-next-line camelcase
        container_name: appName + '_database',
        environment: [
          'MYSQL_ROOT_PASSWORD=lamp',
          'MYSQL_DATABASE=lamp',
        ],
        expose: [
          '3306',
        ],
        restart: 'always',
      }
      // eslint-disable-next-line camelcase
      dockerCompose.services.php.depends_on = [
        'database',
      ]
    }

    if (additionalServices.includes('mail')) {
      dockerCompose.services.mail = {
        image: 'mailhog/mailhog',
        // eslint-disable-next-line camelcase
        container_name: appName + '_mailhog',
        labels: [
          'traefik.enable=true',
          'traefik.http.services.mailhog.loadbalancer.server.port=8025',
          'traefik.http.routers.mailhog.rule=Host(`' + appName + '-mail.kickoff.test`)',
          'traefik.http.routers.mailhog.tls=true',
        ],
        expose: [
          '8025',
        ],
        networks: [
          'kickoff-proxy',
        ],
        restart: 'always',
      }
    }

    return dockerCompose
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
        type: 'list',
        name: 'php',
        message: 'PHP version:',
        choices: ['7.3', '7.4', '8'],
      },
      {
        type: 'input',
        name: 'name',
        message: 'Application name:',
      },
      {
        type: 'checkbox',
        name: 'services',
        message: 'Additional services:',
        choices: ['database', 'mail'],
      },
    ])

    this.generateProjectFiles(userInput)
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
