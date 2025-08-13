import * as yaml from 'js-yaml'
import * as fs from 'node:fs/promises'

// TypeScript interfaces for our Docker Compose structures
interface DockerComposeService {
  build?: string | { context: string; dockerfile?: string }
  command?: string
  container_name?: string
  depends_on?: string[]
  environment?: Record<string, string>
  image?: string
  networks?: string[]
  ports?: string[]
  restart?: string
  volumes?: string[]
}

interface DockerComposeConfig {
  networks?: Record<string, unknown>
  services: Record<string, DockerComposeService>
  version: string
  volumes?: Record<string, unknown>
}

// Interface for user input configuration
interface UserConfig {
  additionalServices: string[]
  cachingServices?: string[]
  customImage?: string
  databaseEngine?: 'mariadb' | 'mysql' | 'other' | 'postgres'
  databaseVersion?: string
  projectName: string
  projectType: 'drupal' | 'nextjs' | 'symfony'
  requiresDatabase: boolean
  searchEngine?: string
  version: string
  webServer: string
}

export class DockerComposeGenerator {
  private config: UserConfig

  constructor(config: UserConfig) {
    this.config = config
  }

  /**
   * Generate the complete Docker Compose configuration
   */
  public async generate(): Promise<void> {
    const composeConfig: DockerComposeConfig = {
      networks: {},
      services: {},
      version: '3.8',
      volumes: {}
    }

    // Add web service based on project type
    this.addWebService(composeConfig)

    // Add database service if required
    if (this.config.requiresDatabase) {
      this.addDatabaseService(composeConfig)
    }

    // Add web server if selected
    if (this.config.webServer && this.config.webServer !== 'none') {
      this.addWebServerService(composeConfig)
    }

    // Add additional services
    if (this.config.additionalServices.includes('mailhog')) {
      this.addMailHogService(composeConfig)
    }

    // Add search engine service
    if (this.config.additionalServices.includes('search') && this.config.searchEngine) {
      this.addSearchService(composeConfig)
    }

    // Add caching services
    if (this.config.additionalServices.includes('caching') && this.config.cachingServices) {
      this.addCachingServices(composeConfig)
    }

    // Add default networks
    composeConfig.networks = {
      default: {
        driver: 'bridge'
      }
    }

    // Generate YAML content
    const yamlContent = yaml.dump(composeConfig, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      quotingType: '"'
    })

    // Write to docker-compose.yml file
    await this.writeComposeFile(yamlContent)
  }

  /**
   * Add caching services
   */
  private addCachingServices(composeConfig: DockerComposeConfig): void {
    if (!this.config.cachingServices || this.config.cachingServices.length === 0) return

    for (const cacheService of this.config.cachingServices) {
      const service: DockerComposeService = {
        // eslint-disable-next-line camelcase
        container_name: `${this.config.projectName}-${cacheService}`,
        networks: ['default'],
        ports: [],
        restart: 'unless-stopped'
      }

      switch (cacheService) {
        case 'memcache': {
          service.image = 'memcached:alpine'
          service.ports = ['11211:11211']
          break
        }

        case 'redis': {
          service.image = 'redis:alpine'
          service.ports = ['6379:6379']
          break
        }

        case 'varnish': {
          service.image = 'varnish:alpine'
          service.ports = ['8081:80']
          service.volumes = [`./config/varnish:/etc/varnish`]
          service.environment = {
            'VARNISH_SIZE': '256m'
          }
          break
        }
      }

      composeConfig.services[cacheService] = service
    }
  }

  /**
   * Add database service based on user selection
   */
  private addDatabaseService(composeConfig: DockerComposeConfig): void {
    if (!this.config.requiresDatabase) return

    const service: DockerComposeService = {
      build: undefined,
      command: undefined,
      // eslint-disable-next-line camelcase
      container_name: `${this.config.projectName}-database`,
      // eslint-disable-next-line camelcase
      depends_on: undefined,
      environment: {},
      image: undefined,
      networks: ['default'],
      ports: ['3306:3306'],
      restart: 'unless-stopped',
      volumes: [`${this.config.projectName}-db-data:/var/lib/mysql`]
    }

    if (this.config.databaseEngine === 'other' && this.config.customImage) {
      service.image = this.config.customImage
    } else {
      switch (this.config.databaseEngine) {
        case 'mariadb': {
          service.image = `mariadb:${this.config.databaseVersion}`
          service.ports = ['3306:3306']
          service.environment = {
            'MYSQL_DATABASE': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'MYSQL_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'MYSQL_ROOT_PASSWORD': 'root',
            'MYSQL_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
          }
          service.volumes = [`${this.config.projectName}-mariadb-data:/var/lib/mysql`]
          break
        }
  
        case 'mysql': {
          service.image = `mysql:${this.config.databaseVersion}`
          service.ports = ['3306:3306']
          service.environment = {
            'MYSQL_DATABASE': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'MYSQL_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'MYSQL_ROOT_PASSWORD': 'root',
            'MYSQL_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
          }
          service.volumes = [`${this.config.projectName}-mysql-data:/var/lib/mysql`]
          break
        }
  
        case 'postgres': {
          service.image = `postgres:${this.config.databaseVersion}`
          service.ports = ['5432:5432']
          service.environment = {
            'POSTGRES_DB': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'POSTGRES_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
            'POSTGRES_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
          }
          service.volumes = [`${this.config.projectName}-postgres-data:/var/lib/postgresql/data`]
          break
        }
      }
    }

    switch (this.config.databaseEngine) {
      case 'mariadb': {
        service.image = `mariadb:${this.config.databaseVersion}`
        service.ports = ['3306:3306']
        service.environment = {
          'MYSQL_DATABASE': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'MYSQL_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'MYSQL_ROOT_PASSWORD': 'root',
          'MYSQL_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
        }
        service.volumes = [`${this.config.projectName}-mariadb-data:/var/lib/mysql`]
        break
      }

      case 'mysql': {
        service.image = `mysql:${this.config.databaseVersion}`
        service.ports = ['3306:3306']
        service.environment = {
          'MYSQL_DATABASE': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'MYSQL_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'MYSQL_ROOT_PASSWORD': 'root',
          'MYSQL_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
        }
        service.volumes = [`${this.config.projectName}-mysql-data:/var/lib/mysql`]
        break
      }

      case 'postgres': {
        service.image = `postgres:${this.config.databaseVersion}`
        service.ports = ['5432:5432']
        service.environment = {
          'POSTGRES_DB': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'POSTGRES_PASSWORD': this.config.projectType === 'drupal' ? 'drupal' : 'app',
          'POSTGRES_USER': this.config.projectType === 'drupal' ? 'drupal' : 'app'
        }
        service.volumes = [`${this.config.projectName}-postgres-data:/var/lib/postgresql/data`]
        break
      }
    }

    composeConfig.services.database = service

    // Add volume for the database
    if (!composeConfig.volumes) {
      composeConfig.volumes = {}
    }
    
    const volumeName = this.getDatabaseVolumeName()
    if (volumeName) {
      composeConfig.volumes[volumeName] = null
    }
  }

  /**
   * Add MailHog service
   */
  private addMailHogService(composeConfig: DockerComposeConfig): void {
    const service: DockerComposeService = {
      // eslint-disable-next-line camelcase
      container_name: `${this.config.projectName}-mailhog`,
      image: 'mailhog/mailhog',
      networks: ['default'],
      ports: ['1025:1025', '8025:8025'],
      restart: 'unless-stopped'
    }

    composeConfig.services.mailhog = service
  }

  /**
   * Add search engine service
   */
  private addSearchService(composeConfig: DockerComposeConfig): void {
    if (!this.config.searchEngine) return

    const service: DockerComposeService = {
      // eslint-disable-next-line camelcase
      container_name: `${this.config.projectName}-${this.config.searchEngine}`,
      networks: ['default'],
      ports: [],
      restart: 'unless-stopped',
      volumes: [],
    }

    switch (this.config.searchEngine) {
      case 'elasticsearch': {
        service.image = 'elasticsearch:8.15.0'
        service.ports = ['9200:9200', '9300:9300']
        service.environment = {
          'discovery.type': 'single-node',
          'ES_JAVA_OPTS': '-Xms1g -Xmx1g'
        }
        service.volumes = [`${this.config.projectName}-es-data:/usr/share/elasticsearch/data`]
        break
      }

      case 'meilisearch': {
        service.image = 'getmeili/meilisearch:v1.11'
        service.ports = ['7700:7700']
        service.environment = {
          'MEILI_ENV': 'development',
          'MEILI_MASTER_KEY': 'masterKey',
        }
        service.volumes = [`${this.config.projectName}-meili-data:/meili_data`]
        break
      }
    }

    composeConfig.services[this.config.searchEngine] = service

    // Add search engine volumes
    if (!composeConfig.volumes) {
      composeConfig.volumes = {}
    }
    
    const volumeName = this.getSearchVolumeName()
    if (volumeName) {
      composeConfig.volumes[volumeName] = null
    }
  }

  /**
   * Add web server service
   */
  private addWebServerService(composeConfig: DockerComposeConfig): void {
    if (!this.config.webServer || this.config.webServer === 'none') return

    const service: DockerComposeService = {
      // eslint-disable-next-line camelcase
      container_name: `${this.config.projectName}-${this.config.webServer}`,
      // eslint-disable-next-line camelcase
      depends_on: [this.config.projectName],
      networks: ['default'],
      ports: ['80:80', '443:443'],
      restart: 'unless-stopped',
      volumes: [
        './app:/var/www/html',
        `./config/${this.config.webServer}:/etc/${this.config.webServer}/conf.d`
      ]      
    }

    switch (this.config.webServer) {
      case 'apache': {
        service.image = 'httpd:alpine'
        break
      }

      case 'frankenphp': {
        service.image = 'dunglas/frankenphp'
        break
      }

      case 'nginx': {
        service.image = 'nginx:alpine'
        break
      }

      case 'nginx-unit': {
        service.image = 'nginx/unit:latest'
        break
      }
    }

    composeConfig.services[this.config.webServer] = service
  }

  /**
   * Add web service based on project type
   */
  private addWebService(composeConfig: DockerComposeConfig): void {
    const serviceName = this.config.projectName
    const service: DockerComposeService = {
      build: undefined,
      command: undefined,
      // eslint-disable-next-line camelcase
      container_name: `${this.config.projectName}-app`,
      // eslint-disable-next-line camelcase
      depends_on: undefined,
      environment: undefined,
      image: undefined,
      networks: ['default'],
      ports: ['3000:3000'],
      restart: 'unless-stopped',
      volumes: ['./app:/var/www/html']
    }

    switch (this.config.projectType) {
      case 'drupal': {
        service.image = `drupal:${this.config.version}-apache`
        service.ports = ['8080:80']
        service.volumes = [
          './app:/var/www/html',
          './app/sites/default:/var/www/html/sites/default'
        ]
        service.environment = {
          'DRUPAL_DATABASE_HOST': this.config.requiresDatabase ? 'database' : '',
          'DRUPAL_DATABASE_NAME': 'drupal',
          'DRUPAL_DATABASE_PASSWORD': 'drupal',
          'DRUPAL_DATABASE_USER': 'drupal'
        }
        if (this.config.requiresDatabase) {
          // eslint-disable-next-line camelcase
          service.depends_on = ['database']
        }

        break
      }

      case 'nextjs': {
        service.build = {
          context: './app',
          dockerfile: 'Dockerfile'
        }
        service.ports = ['3000:3000']
        service.volumes = ['./app:/app']
        service.command = 'npm run dev'
        service.environment = {
          'NODE_ENV': 'development'
        }
        if (this.config.requiresDatabase) {
          // eslint-disable-next-line camelcase
          service.depends_on = ['database']
        }

        break
      }

      case 'symfony': {
        service.image = `php:${this.config.version}-apache`
        service.ports = ['8080:80']
        service.volumes = [
          './app:/var/www/html',
          './app/var:/var/www/html/var'
        ]
        service.environment = {
          'APP_ENV': 'dev',
          'DATABASE_URL': this.config.requiresDatabase ? 
            this.getSymfonyDatabaseUrl() : 'sqlite:///var/data.db'
        }
        if (this.config.requiresDatabase) {
          // eslint-disable-next-line camelcase
          service.depends_on = ['database']
        }

        break
      }
    }

    composeConfig.services[serviceName] = service
  }

  /**
   * Get database volume name based on database engine
   */
  private getDatabaseVolumeName(): null | string  {
    if (!this.config.databaseEngine) return null

    switch (this.config.databaseEngine) {
      case 'mariadb': {
        return `${this.config.projectName}-mariadb-data`
      }

      case 'mysql': {
        return `${this.config.projectName}-mysql-data`
      }

      case 'postgres': {
        return `${this.config.projectName}-postgres-data`
      }

      default: {
        return null
      }
    }
  }

  /**
   * Get search engine volume name
   */
  private getSearchVolumeName(): null | string {
    if (!this.config.searchEngine) return null

    switch (this.config.searchEngine) {
      case 'elasticsearch': {
        return `${this.config.projectName}-es-data`
      }

      case 'meilisearch': {
        return `${this.config.projectName}-meili-data`
      }

      default: {
        return null
      }
    }
  }

  /**
   * Get Symfony database URL format
   */
  private getSymfonyDatabaseUrl(): string {
    if (!this.config.databaseEngine || !this.config.databaseVersion) return ''

    switch (this.config.databaseEngine) {
      case 'mariadb': {
        return `mysql://app:app@database:3306/app?serverVersion=${this.config.databaseVersion}`
      }

      case 'mysql': {
        return ''
      }

      case 'postgres': {
        return `postgresql://app:app@database:5432/app?serverVersion=${this.config.databaseVersion}`
      }
      
      default: {
        return ''
      }
    }
  }

  /**
   * Write the Docker Compose file to disk
   */
  private async writeComposeFile(content: string): Promise<void> {
    try {
      // Create app directory if it doesn't exist
      await fs.mkdir('./app', { recursive: true })
      
      // Create config directories for web servers
      if (this.config.webServer && this.config.webServer !== 'none') {
        await fs.mkdir(`./config/${this.config.webServer}`, { recursive: true })
      }
      
      // Create config directory for varnish if needed
      if (this.config.cachingServices?.includes('varnish')) {
        await fs.mkdir('./config/varnish', { recursive: true })
      }
      
      // Write docker-compose.yml file
      await fs.writeFile('docker-compose.yml', content, 'utf8')
      
      console.log('✅ Docker Compose file generated successfully!')
      console.log('📁 Files created:')
      console.log('   - docker-compose.yml')
      console.log('   - app/ (application directory)')
      if (this.config.webServer && this.config.webServer !== 'none') {
        console.log(`   - config/${this.config.webServer}/ (web server config)`)
      }
      
      if (this.config.cachingServices?.includes('varnish')) {
        console.log('   - config/varnish/ (varnish config)')
      }
    } catch (error) {
      throw new Error(`Failed to write Docker Compose file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
