const {Command, flags} = require('@oclif/command')
const {exec} = require('child_process')
const chalk  = require('chalk')
const Dockerode = require('dockerode')
const docker = new Dockerode()
const fs = require('fs')
const ncp = require('ncp').ncp
const yaml = require('js-yaml')
const selfsigned = require('selfsigned')
const async = require('async')
const path = require('path')

class StartCommand extends Command {
  async isProxyRunning() {
    let containers = await docker.listContainers()
    if (containers.length === 0) {
      return false
    }

    let kickoffProxyRunning = containers.find(container => {
      return container.Names[0] === '/kickoff_proxy'
    })

    if (!kickoffProxyRunning) {
      return false
    }

    return true
  }

  dockerComposeUp() {
    this.log(chalk.cyan('Starting project docker services...'))
    exec('docker-compose up -d', (err, stdout, stderr) => {
      if (err || stderr) {
        this.log(chalk.red(err))
        this.log(chalk.red(stderr))
        return
      }

      this.log(stdout)
    })
  }

  startProxy() {
    this.log(chalk.cyan('Starting reverse-proxy...'))
    let proxyComposeFilePath = process.env.HOME + '/.kickoff/docker-compose.yml'
    if (!fs.existsSync(proxyComposeFilePath)) {
      this.log(chalk.cyan('Reverse-proxy files not found... at' + proxyComposeFilePath))
      this.generateProxyFiles()
      this.startProxyService()
    }

    this.dockerComposeUp()
  }

  startProxyService() {
    this.log(chalk.cyan('Starting reverse-proxy docker service...'))
    exec('docker-compose up -d', {
      cwd: process.env.HOME + '/.kickoff',
    }, (err, stdout, stderr) => {
      if (err || stderr) {
        this.log(chalk.red(err))
        this.log(chalk.red(stderr))
        return
      }

      // the *entire* stdout and stderr (buffered)
      this.log(`stdout: ${stdout}`)
    })
  }

  generateProxyFiles() {
    this.log(chalk.cyan('Creating reverse-proxy folder...'))
    let proxyComposeDirectory = process.env.HOME + '/.kickoff'
    let proxyConfigFolder = path.join(__dirname, '/templates/traefik')
    fs.mkdir(proxyComposeDirectory, err => {
      if (err) {
        return this.log("There was a problem creating the kickoff proxy's folder: " + chalk.red(err.toString()))
      }
      this.log('Folder - ' + chalk.bold(proxyComposeDirectory) + ' -  ' + chalk.green('successfully created!'))
      // Copy nginx & PHP ini files
      ncp(proxyConfigFolder, proxyComposeDirectory, err => {
        if (err) {
          return this.log('There was a problem while copying the proxy\'s files: ' + chalk.red(err))
        }
      })
    })

    this.log(chalk.cyan('Generating reverse-proxy docker-compose.yml...'))
    let dockerCompose = this.getProxyDockerCompose()
    fs.writeFile(proxyComposeDirectory + '/docker-compose.yml', yaml.safeDump(dockerCompose), 'utf8', err => {
      if (err) {
        return this.log('There was a problem while generating the proxy\'s docker-compose.yaml file: ' + chalk.red(err))
      }
    })

    this.log(chalk.cyan('Generating reverse-proxy certificates...'))
    fs.mkdir(proxyComposeDirectory + '/certs', err => {
      if (err) {
        return this.log("There was a problem creating the kickoff proxy's cert folder: " + chalk.red(err.toString()))
      }
      this.log('Folder - ' + chalk.bold(proxyComposeDirectory + '/certs') + ' -  ' + chalk.green('successfully created!'))
    })

    let sslCert = this.generateCertificates()
    async.parallel([
      function (callback) {
        fs.appendFile(proxyComposeDirectory + '/certs/kickoff.key', JSON.stringify(sslCert.private, null, 4), callback)
      },
      function (callback) {
        fs.appendFile(proxyComposeDirectory + '/certs/kickoff.crt', JSON.stringify(sslCert.cert, null, 4), callback)
      },
    ],
    function (err, results) {
      if (err) {
        this.log('There was a problem generating the sslt certs for the kickoff proxy: ' + chalk.red(err.toString()))
      }
    })
  }

  generateCertificates() {
    return selfsigned.generate([{name: 'commonName', value: '*.kickoff.test'}], {days: 3650})
  }

  getProxyDockerCompose() {
    return {
      version: '3',
      services: {
        'reverse-proxy': {
          image: 'traefik:2.3',
          // eslint-disable-next-line camelcase
          container_name: 'kickoff_proxy',
          labels: [
            'traefik.enable=true',
            'traefik.http.services.traefik.loadbalancer.server.port=8080',
            'traefik.http.routers.mailhog.rule=Host(`proxy.kickoff.test`)',
            'traefik.http.routers.mailhog.tls=true',
          ],
          expose: [
            8080,
          ],
          volumes: [
            '/var/run/docker.sock:/var/run/docker.sock:ro',
            './traefik.yml:/etc/traefik/traefik.yml',
            './certificates.yml:/etc/traefik/certificates.yml',
            './certs:/certs',
          ],
          ports: [
            '80:80',
            '443:443',
          ],
          restart: 'always',
        },
      },
    }
  }

  async run() {
    let isTraefikRunning = await this.isProxyRunning()
    if (!isTraefikRunning) {
      this.log(chalk.cyan('Proxy not running'))
      this.startProxy()
    }

    this.dockerComposeUp()
  }
}

StartCommand.description = `Describe the command here
...
Extra documentation goes here
`

StartCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = StartCommand
