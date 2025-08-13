kickoff
=================

CLI tool that speeds up bootstrapping a Docker Compose setup forDrupal, Symfony, or Next.js development projects


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/kickoff.svg)](https://npmjs.org/package/kickoff)
[![Downloads/week](https://img.shields.io/npm/dw/kickoff.svg)](https://npmjs.org/package/kickoff)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g kickoff
$ kickoff COMMAND
running command...
$ kickoff (--version)
kickoff/0.1.0 linux-x64 node-v22.14.0
$ kickoff --help [COMMAND]
USAGE
  $ kickoff COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`kickoff help [COMMAND]`](#kickoff-help-command)
* [`kickoff init`](#kickoff-init)
* [`kickoff plugins`](#kickoff-plugins)
* [`kickoff plugins add PLUGIN`](#kickoff-plugins-add-plugin)
* [`kickoff plugins:inspect PLUGIN...`](#kickoff-pluginsinspect-plugin)
* [`kickoff plugins install PLUGIN`](#kickoff-plugins-install-plugin)
* [`kickoff plugins link PATH`](#kickoff-plugins-link-path)
* [`kickoff plugins remove [PLUGIN]`](#kickoff-plugins-remove-plugin)
* [`kickoff plugins reset`](#kickoff-plugins-reset)
* [`kickoff plugins uninstall [PLUGIN]`](#kickoff-plugins-uninstall-plugin)
* [`kickoff plugins unlink [PLUGIN]`](#kickoff-plugins-unlink-plugin)
* [`kickoff plugins update`](#kickoff-plugins-update)

## `kickoff help [COMMAND]`

Display help for kickoff.

```
USAGE
  $ kickoff help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for kickoff.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.32/src/commands/help.ts)_

## `kickoff init`

Initialize a new Docker Compose setup for Drupal, Symfony, or Next.js

```
USAGE
  $ kickoff init [--additional-services <value>] [--caching-services <value>] [-d] [--database-engine
    mysql|mariadb|postgres|other] [--database-image <value>] [--database-version <value>] [-f] [-o <value>] [-n <value>]
    [-t drupal|symfony|nextjs] [-q] [--search-engine elasticsearch|meilisearch] [-v <value>] [-w
    nginx|apache|nginx-unit|frankenphp|none]

FLAGS
  -d, --database                     Include a database service
  -f, --force                        Overwrite existing files without prompting
  -n, --project-name=<value>         Project name/directory name
  -o, --output-dir=<value>           [default: .] Output directory for generated files
  -q, --quiet                        Suppress output messages
  -t, --project-type=<option>        Framework type
                                     <options: drupal|symfony|nextjs>
  -v, --version=<value>              PHP/Node.js version to use
  -w, --web-server=<option>          Web server to use
                                     <options: nginx|apache|nginx-unit|frankenphp|none>
      --additional-services=<value>  Additional services to include (search,mailhog,caching)
      --caching-services=<value>     Caching services to include (redis,memcache,varnish)
      --database-engine=<option>     Database engine to use
                                     <options: mysql|mariadb|postgres|other>
      --database-image=<value>       Custom Docker image for database (when engine is other)
      --database-version=<value>     Database version to use
      --search-engine=<option>       Search engine to use
                                     <options: elasticsearch|meilisearch>

DESCRIPTION
  Initialize a new Docker Compose setup for Drupal, Symfony, or Next.js

EXAMPLES
  $ kickoff init

  $ kickoff init --project-name myapp --project-type drupal --version 8.2 --web-server nginx --database --database-engine mysql --database-version 8.4

  $ kickoff init -n myapp -t nextjs -v 20 -w none --additional-services search,mailhog --search-engine meilisearch
```

_See code: [src/commands/init.ts](https://github.com/reddevs-io/kickoff/blob/v0.1.0/src/commands/init.ts)_

## `kickoff plugins`

List installed plugins.

```
USAGE
  $ kickoff plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ kickoff plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/index.ts)_

## `kickoff plugins add PLUGIN`

Installs a plugin into kickoff.

```
USAGE
  $ kickoff plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into kickoff.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the KICKOFF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the KICKOFF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ kickoff plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ kickoff plugins add myplugin

  Install a plugin from a github url.

    $ kickoff plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ kickoff plugins add someuser/someplugin
```

## `kickoff plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ kickoff plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ kickoff plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/inspect.ts)_

## `kickoff plugins install PLUGIN`

Installs a plugin into kickoff.

```
USAGE
  $ kickoff plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into kickoff.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the KICKOFF_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the KICKOFF_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ kickoff plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ kickoff plugins install myplugin

  Install a plugin from a github url.

    $ kickoff plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ kickoff plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/install.ts)_

## `kickoff plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ kickoff plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ kickoff plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/link.ts)_

## `kickoff plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ kickoff plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ kickoff plugins unlink
  $ kickoff plugins remove

EXAMPLES
  $ kickoff plugins remove myplugin
```

## `kickoff plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ kickoff plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/reset.ts)_

## `kickoff plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ kickoff plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ kickoff plugins unlink
  $ kickoff plugins remove

EXAMPLES
  $ kickoff plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/uninstall.ts)_

## `kickoff plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ kickoff plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ kickoff plugins unlink
  $ kickoff plugins remove

EXAMPLES
  $ kickoff plugins unlink myplugin
```

## `kickoff plugins update`

Update installed plugins.

```
USAGE
  $ kickoff plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/update.ts)_
<!-- commandsstop -->
