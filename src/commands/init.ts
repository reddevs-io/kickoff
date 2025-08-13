import {checkbox, input, select} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'

import {DockerComposeGenerator} from '../services/docker-compose-generator.js'

export default class Init extends Command {
  static description = 'Initialize a new Docker Compose setup for Drupal, Symfony, or Next.js'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --project-name myapp --project-type drupal --version 8.2 --web-server nginx --database --database-engine mysql --database-version 8.4',
    '<%= config.bin %> <%= command.id %> -n myapp -t nextjs -v 20 -w none --additional-services search,mailhog --search-engine meilisearch'
  ]
static flags = {
    // Additional services arguments
    'additional-services': Flags.string({
      description: 'Additional services to include (search,mailhog,caching)',
      required: false,
    }),

    'caching-services': Flags.string({
      description: 'Caching services to include (redis,memcache,varnish)',
      required: false,
    }),

    // Database arguments
    database: Flags.boolean({
      char: 'd',
      default: false,
      description: 'Include a database service',
      required: false,
    }),

    'database-engine': Flags.option({
      description: 'Database engine to use',
      options: ['mysql', 'mariadb', 'postgres', 'other'] as const,
      required: false,
    })(),

    'database-image': Flags.string({
      description: 'Custom Docker image for database (when engine is other)',
      required: false,
    }),

    'database-version': Flags.string({
      description: 'Database version to use',
      required: false,
    }),

    force: Flags.boolean({
      char: 'f',
      default: false,
      description: 'Overwrite existing files without prompting',
    }),

    // Utility arguments
    'output-dir': Flags.string({
      char: 'o',
      default: '.',
      description: 'Output directory for generated files',
    }),

    // Core arguments
    'project-name': Flags.string({
      char: 'n',
      description: 'Project name/directory name',
      required: false,
    }),

    'project-type': Flags.option({
      char: 't',
      description: 'Framework type',
      options: ['drupal', 'symfony', 'nextjs'] as const,
      required: false,
    })(),

    quiet: Flags.boolean({
      char: 'q',
      default: false,
      description: 'Suppress output messages',
    }),

    'search-engine': Flags.option({
      description: 'Search engine to use',
      options: ['elasticsearch', 'meilisearch'] as const,
      required: false,
    })(),

    version: Flags.string({
      char: 'v',
      description: 'PHP/Node.js version to use',
      required: false,
    }),

    'web-server': Flags.option({
      char: 'w',
      description: 'Web server to use',
      options: ['nginx', 'apache', 'nginx-unit', 'frankenphp', 'none'] as const,
      required: false,
    })(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Init)
    
    // Helper function to log messages (respects quiet flag)
    const logMessage = (message: string) => {
      if (!flags.quiet) {
        this.log(message)
      }
    }

    // Get project name (from flag or interactive prompt)
    let projectName = flags['project-name']
    if (!projectName) {
      projectName = await input({
        message: 'What is your project name?',
        validate(input: string) {
          if (!input) {
            return 'Project name is required'
          }
          
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Project name must be lowercase and contain only letters, numbers, and hyphens (no spaces)'
          }

          return true
        },
      })
    }
    logMessage(`Project name: ${projectName}`)

    // Get project type (from flag or interactive prompt)
    let projectType = flags['project-type']
    if (!projectType) {
      projectType = await select({
        choices: [
          {name: 'Drupal', value: 'drupal'},
          {name: 'Symfony', value: 'symfony'},
          {name: 'Next.js', value: 'nextjs'},
        ],
        message: 'Which type of project would you like to setup?',
      })
    }
    logMessage(`Selected project type: ${projectType}`)

    // Get version (from flag or interactive prompt)
    let version = flags.version
    if (!version) {
      version = projectType === 'nextjs'
        ? await select({
            choices: [
              {name: 'Latest', value: 'latest'},
              {name: '20', value: '20'},
              {name: '22', value: '22'},
              {name: '24', value: '24'},
              {name: 'LTS', value: 'lts'},
            ],
            message: 'Which Node.js version would you like to use?',
          })
        : await select({
            choices: [
              {name: '8.4', value: '8.4'},
              {name: '8.3', value: '8.3'},
              {name: '8.2', value: '8.2'},
            ],
            message: 'Which PHP version would you like to use?',
          })
    }
    logMessage(`Selected version: ${version}`)

    // Get database requirement (from flag or interactive prompt)
    let requiresDatabase = flags.database
    let databaseEngine = flags['database-engine'] as 'mariadb' | 'mysql' | 'other' | 'postgres' | undefined
    let databaseVersion = flags['database-version']
    let customImage = flags['database-image']

    if (requiresDatabase && !databaseEngine) {
      databaseEngine = await select({
        choices: [
          {name: 'MySQL', value: 'mysql'},
          {name: 'MariaDB', value: 'mariadb'},
          {name: 'PostgreSQL', value: 'postgres'},
          {name: 'Other (specify Docker image)', value: 'other'},
        ],
        message: 'Which database engine would you like to use?',
      }) as 'mariadb' | 'mysql' | 'other' | 'postgres' | undefined

      if (databaseEngine === 'other') {
        if (!customImage) {
          customImage = await input({
            message: 'Enter the Docker image (e.g., mongo:8.0, myregistry.com/mydb:latest):',
          })
        }
        logMessage(`Selected custom database image: ${customImage}`)
      } else {
        if (!databaseVersion) {
          // Database version selection
          let versionChoices: Array<{name: string; value: string}> = []
          
          switch (databaseEngine) {
            case 'mariadb': {
              versionChoices = [
                {name: 'Latest', value: 'latest'},
                {name: 'Long-term Support', value: 'lts'},
                {name: '10.11', value: '10.11'},
                {name: '10.6', value: '10.6'},
              ]
              break
            }

            case 'mysql': {
              versionChoices = [
                {name: 'Latest', value: 'latest'},
                {name: 'Long-term Support', value: 'lts'},
                {name: '9.4', value: '9.4'},
                {name: '8.4', value: '8.4'},
                {name: '8.0', value: '8.0'},
                {name: '5.7', value: '5.7'},
              ]
              break
            }

            case 'postgres': {
              versionChoices = [
                {name: 'Latest', value: 'latest'},
                {name: 'Long-term Support', value: 'lts'},
                {name: '17', value: '17-alpine'},
                {name: '16', value: '16-alpine'},
                {name: '15', value: '15-alpine'},
              ]
              break
            }
          }

          databaseVersion = await select({
            choices: versionChoices,
            message: 'Which version would you like to use?',
          })
        }

        logMessage(`Selected database: ${databaseEngine} ${databaseVersion}`)
      }
    } else if (!requiresDatabase) {
      logMessage('No database selected')
    }

    // Get web server (from flag or interactive prompt)
    let webServer: string = flags['web-server'] || ''
    if (!webServer) {
      const webServerChoices: Array<{name: string; value: string}> = 
        projectType === 'nextjs'
          ? [
              {name: 'None', value: 'none'},
              {name: 'NGINX', value: 'nginx'},
              {name: 'NGINX Unit', value: 'nginx-unit'},
            ]
          : [
              {name: 'NGINX', value: 'nginx'},
              {name: 'Apache', value: 'apache'},
              {name: 'NGINX Unit', value: 'nginx-unit'},
              {name: 'FrankenPHP', value: 'frankenphp'},
            ]

      webServer = await select({
        choices: webServerChoices,
        message: 'Which web server would you like to use?',
      })
    }
    logMessage(`Selected web server: ${webServer}`)

    // Get additional services (from flag or interactive prompt)
    let additionalServices: string[] = []
    if (flags['additional-services'] !== undefined) {
      // If additional-services flag is provided (even if empty), use it
      additionalServices = flags['additional-services'] ? flags['additional-services'].split(',').map((s: string) => s.trim()) : []
    } else {
      additionalServices = await checkbox({
        choices: [
          {name: 'Search Engine', value: 'search'},
          {name: 'MailHog (Email Testing)', value: 'mailhog'},
          {name: 'Caching Services', value: 'caching'},
        ],
        message: 'Which additional services would you like to include?',
        required: false,
      })
    }
    logMessage(`Selected additional services: ${additionalServices.join(', ') || 'None'}`)

    // Handle search engine selection
    let searchEngine = flags['search-engine']
    if (additionalServices.includes('search') && !searchEngine) {
      searchEngine = await select({
        choices: [
          {name: 'Elasticsearch', value: 'elasticsearch'},
          {name: 'Meilisearch', value: 'meilisearch'},
        ],
        message: 'Which search engine would you like to use?',
      })
      logMessage(`Selected search engine: ${searchEngine}`)
    }

    // Handle caching services selection
    let cachingServices: string[] = []
    if (flags['caching-services']) {
      cachingServices = flags['caching-services'].split(',').map((s: string) => s.trim())
    } else if (additionalServices.includes('caching')) {
      cachingServices = await checkbox({
        choices: [
          {name: 'Redis', value: 'redis'},
          {name: 'Memcache', value: 'memcache'},
          {name: 'Varnish', value: 'varnish'},
        ],
        message: 'Which caching services would you like to include?',
        required: false,
      })
      logMessage(`Selected caching services: ${cachingServices.join(', ') || 'None'}`)
    }

    // Handle MailHog (just log if selected)
    if (additionalServices.includes('mailhog')) {
      logMessage('MailHog service will be included')
    }

    // Generate Docker Compose configuration
    try {
      const generator = new DockerComposeGenerator({
        additionalServices,
        cachingServices: additionalServices.includes('caching') ? cachingServices : undefined,
        customImage: databaseEngine === 'other' ? customImage : undefined,
        databaseEngine: requiresDatabase ? databaseEngine : undefined,
        databaseVersion: requiresDatabase && databaseEngine !== 'other' ? databaseVersion : undefined,
        projectName,
        projectType: projectType as 'drupal' | 'nextjs' | 'symfony',
        requiresDatabase: requiresDatabase || false,
        searchEngine: additionalServices.includes('search') ? searchEngine : undefined,
        version,
        webServer,
      })

      await generator.generate()
      logMessage('🎉 Docker Compose setup completed successfully!')
    } catch (error) {
      this.error(`Failed to generate Docker Compose setup: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
