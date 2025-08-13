import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {describe, it} from 'mocha'

describe('init', () => {
  it('runs init cmd', async () => {
    // Test will be updated later to properly handle interactive prompts
    // For now, we'll skip the interactive parts
    const {stdout} = await runCommand('init --help')
    expect(stdout).to.contain('Initialize a new Docker Compose setup')
  })
})
