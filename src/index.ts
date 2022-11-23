import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { markdownTable } from 'markdown-table'

const NpmApi = require('npm-api')
const fetch = require('node-fetch')

const fileName = 'README.md'

const filePath = resolve(__dirname, '..', fileName)

const pkgCfg = readFileSync(resolve(__dirname, '..', 'pkg.json')).toString()

const pkgConfig: Array<{ name: string }> = JSON.parse(pkgCfg)


const npm = new NpmApi();

function getRepo(repository: Record<string, string>) {
  const { url } = repository
  return url.split('github.com')[1].split('.')[0]
}


// write header
const header = markdownTable([
  ['package', 'stars', 'forks', 'issues', 'repository'],
])
writeFileSync(filePath, `${header}\n`)

async function run() {
  pkgConfig.map(async element => {
    const { name } = element
    const repo = npm.repo(name);
    // get downloads 
    // const pkg = await repo.package()
    const repository = await repo.prop('repository')
    
    const gitMsg = await fetch(`https://api.github.com/repos${getRepo(repository)}`)
    let result = markdownTable([[name, '', '', '', '']])

    if(gitMsg.ok) {
      // stars forks, issues, url
      const { stargazers_count, forks, open_issues, html_url } = await gitMsg.json()
      result = markdownTable([[name, stargazers_count, forks, open_issues, `(repository)[${html_url}]`]])
    }
    writeFileSync(filePath, `${result}\n`, { flag: 'a' })
  });
}

run()