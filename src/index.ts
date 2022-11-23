import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { markdownTable } from 'markdown-table'

const NpmApi = require('npm-api')
const fetch = require('node-fetch')

interface PkgConfig {
  name: string
}

interface ModuleConfig {
  [key: string]: Array<PkgConfig>
}

const fileName = 'README.md'
const info = `---
id: ${new Date()}
author: PengboUestc
---

`

const filePath = resolve(__dirname, '..', fileName)
writeFileSync(filePath, info)

const pkgCfg = readFileSync(resolve(__dirname, '..', 'pkg.json')).toString()

const pkgConfig: ModuleConfig = JSON.parse(pkgCfg)

const npm = new NpmApi();


function getRepo(repository: Record<string, string>) {
  const { url } = repository
  return url.split('github.com')[1].split('.')[0]
}

// write header
const header = ['package', 'stars', 'forks', 'issues', 'repository']

function getData(pkgList: Array<PkgConfig>): Array<Promise<string[]>> {
  return pkgList.map(async (element): Promise<string[]> => {
    const { name } = element
    const repo = npm.repo(name);
    // get downloads 
    // const pkg = await repo.package()
    const repository = await repo.prop('repository')
    
    const gitMsg = await fetch(`https://api.github.com/repos${getRepo(repository)}`)

    if(!gitMsg.ok) return [name, '', '', '', '']
    // stars forks, issues, url
    const { stargazers_count, forks, open_issues, html_url } = await gitMsg.json()
    return [name, stargazers_count, forks, open_issues, `[repository](${html_url})`]
    
  });
}

async function run(pkgConfig: ModuleConfig) {
  Object.entries(pkgConfig).forEach(async ([key, pkgList]) => {
    writeFileSync(filePath, `## ${key}\n`, { flag: 'a' })
    const dataList = (await Promise.all(getData(pkgList))).sort((pre, post) => {
      return  +post[1] - (+pre[1])
    })

    dataList.unshift(header)
    writeFileSync(filePath, markdownTable(dataList), { flag: 'a' })
  })

}
run(pkgConfig)