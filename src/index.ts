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

const now = new Date()
const time = `${now.getFullYear()}-${(now.getMonth() + '').padStart(2, '0')}-${(now.getDate() + '').padStart(2, '0')}`
const fileName = 'README.md'
const info = `---
id: ${time}
author: [PengboUestc](https://github.com/PengBoUESTC)
---

`

const filePath = resolve(process.cwd(), fileName)
writeFileSync(filePath, info)

const pkgCfg = readFileSync(resolve(__dirname, '..', 'pkg.json')).toString()

const pkgConfig: ModuleConfig = JSON.parse(pkgCfg)

const npm = new NpmApi();


function getRepo(repository: Record<string, string>) {
  const { url } = repository
  return url.split('github.com')[1].split('.')[0]
}

// write header

function getData(pkgList: Array<PkgConfig>): Array<Promise<string[]>> {
  return pkgList.map(async (element): Promise<string[]> => {
    const { name } = element
    const repo = npm.repo(name);
    // get downloads 
    const downloads: Array<{ day: string, downloads: number }> = await repo.downloads(time)
    const totalDownload = downloads.reduce((pre: number, post: { downloads: number }) => { 
        return pre + post.downloads
    }, 0)
    const averageDownload = Math.round(totalDownload / downloads.length)
    const repository = await repo.prop('repository')
    
    const gitMsg = await fetch(`https://api.github.com/repos${getRepo(repository)}`)

    if(!gitMsg.ok) return [name, '', '', '', '', `${averageDownload}`]
    // stars forks, issues, url
    const { stargazers_count, forks, open_issues, html_url } = await gitMsg.json()
    return [name, stargazers_count, forks, open_issues, `[repository](${html_url})`, `${averageDownload}`]
  });
}

async function run(pkgConfig: ModuleConfig) {
  const header = ['package', 'stars', 'forks', 'issues', 'repository', 'download(avg of 1 month)']

  Object.entries(pkgConfig).forEach(async ([key, pkgList]) => {
    const dataList = (await Promise.all(getData(pkgList))).sort((pre, post) => {
      return  +post[1] - (+pre[1])
    })

    dataList.unshift(header)
    writeFileSync(filePath, `## ${key}\n${markdownTable(dataList)}\n`, { flag: 'a' })
  })

}
run(pkgConfig)