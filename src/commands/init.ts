import {checkbox, confirm, input, select} from '@inquirer/prompts'
import {Command} from '@oclif/core'

import {DockerComposeGenerator} from '../services/docker-compose-generator.js'

export default class Init extends Command {
  static override description = 'Initialize a new Docker Compose setup for Drupal, Symfony, or Next.js'
  static override examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // First question: Project name
    const projectName = await input({
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

    this.log(`Project name: ${projectName}`)

    // Second question: Project type selection
    const projectType = await select({
      choices: [
        {name: 'Drupal', value: 'drupal'},
        {name: 'Symfony', value: 'symfony'},
        {name: 'Next.js', value: 'nextjs'},
      ],
      message: 'Which type of project would you like to setup?',
    })

    this.log(`Selected project type: ${projectType}`)

    // Second question: Version selection based on project type
    let version = ''
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

    this.log(`Selected version: ${version}`)

    // Second question: Database requirement
    let requiresDatabase = false
    let databaseEngine: 'mariadb' | 'mysql' | 'other' | 'postgres' | undefined
    let databaseVersion = ''
    let customImage = ''

    requiresDatabase = await confirm({
      message: 'Do you require a database?',
    })

    if (requiresDatabase) {
      // Third question: Database engine selection
      databaseEngine = await select({
        choices: [
          {name: 'MySQL', value: 'mysql'},
          {name: 'MariaDB', value: 'mariadb'},
          {name: 'PostgreSQL', value: 'postgres'},
          {name: 'Other (specify Docker image)', value: 'other'},
        ],
        message: 'Which database engine would you like to use?',
      })

      if (databaseEngine === 'other') {
        customImage = await input({
          message: 'Enter the Docker image (e.g., mongo:8.0, myregistry.com/mydb:latest):',
        })
        this.log(`Selected custom database image: ${customImage}`)
      } else {
        // Fourth question: Database version selection
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

        this.log(`Selected database: ${databaseEngine} ${databaseVersion}`)
      }
    } else {
      this.log('No database selected')
    }

    // Web server selection prompt
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

    const webServer = await select({
      choices: webServerChoices,
      message: 'Which web server would you like to use?',
    })

    this.log(`Selected web server: ${webServer}`)

    // Additional services prompt
    const additionalServices = await checkbox({
      choices: [
        {name: 'Search Engine', value: 'search'},
        {name: 'MailHog (Email Testing)', value: 'mailhog'},
        {name: 'Caching Services', value: 'caching'},
      ],
      message: 'Which additional services would you like to include?',
      required: false,
    })

    this.log(`Selected additional services: ${additionalServices.join(', ') || 'None'}`)

    // Handle search engine selection
    let searchEngine = ''
    if (additionalServices.includes('search')) {
      searchEngine = await select({
        choices: [
          {name: 'Elasticsearch', value: 'elasticsearch'},
          {name: 'Meilisearch', value: 'meilisearch'},
        ],
        message: 'Which search engine would you like to use?',
      })
      this.log(`Selected search engine: ${searchEngine}`)
    }

    // Handle caching services selection
    let cachingServices: string[] = []
    if (additionalServices.includes('caching')) {
      cachingServices = await checkbox({
        choices: [
          {name: 'Redis', value: 'redis'},
          {name: 'Memcache', value: 'memcache'},
          {name: 'Varnish', value: 'varnish'},
        ],
        message: 'Which caching services would you like to include?',
        required: false,
      })
      this.log(`Selected caching services: ${cachingServices.join(', ') || 'None'}`)
    }

    // Handle MailHog (just log if selected)
    if (additionalServices.includes('mailhog')) {
      this.log('MailHog service will be included')
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
        requiresDatabase,
        searchEngine: additionalServices.includes('search') ? searchEngine : undefined,
        version,
        webServer,
      })

      await generator.generate()
      this.log('🎉 Docker Compose setup completed successfully!')
    } catch (error) {
      this.error(`Failed to generate Docker Compose setup: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
