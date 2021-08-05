import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github'
import { LoggingDataClass, LoggingLevels } from '@videndum/utilities'
import fs from 'fs'
import { log } from '.'
import { Config, Label, Options, Runners, SharedConfigIndex } from '../types'
import { CurContext } from './conditions'
import { Issues, Project, PullRequests, Schedule } from './contexts'
import { Utils } from './utils'

let local: any
let context = github.context

try {
  local = require('../config.json')
  process.env.GITHUB_REPOSITORY = local.GITHUB_REPOSITORY
  process.env.GITHUB_REPOSITORY_OWNER = local.GITHUB_REPOSITORY_OWNER
  if (!context.payload.issue && !context.payload.pull_request)
    context = require(local.github_context)
} catch {}

export default class Action {
  client: GitHub
  opts: Options
  configJSON: Options['configJSON']
  configPath: Options['configPath']
  dryRun: Options['dryRun']
  fillEmpty: Options['fillEmpty']
  repo = context.repo || {}
  util: Utils

  constructor(client: GitHub, options: Options) {
    log(
      LoggingLevels.debug,
      `Release Mastermind Constructed: ${options.toString()}`
    )
    core.startGroup('Setup Phase')
    this.client = client
    this.opts = options
    this.dryRun = options.dryRun
    if (this.dryRun) {
      if (options.repo) this.repo = options.repo
      if (!options.repo?.repo)
        this.repo.repo = process.env.GITHUB_REPOSITORY || 'Unknown'
      if (!options.repo?.owner)
        this.repo.owner = process.env.GITHUB_REPOSITORY_OWNER || 'Unknown'
    }
    this.configJSON = options.configJSON
    this.configPath = options.configPath
    this.fillEmpty = options.fillEmpty
    this.util = new Utils(
      { client, repo: this.repo },
      { dryRun: options.dryRun, skipDelete: options.skipDelete }
    )
  }

  async run() {
    log(LoggingLevels.debug, `Repo data: ${this.repo.owner}/${this.repo.repo}`)

    /**
     * Capture and log context to debug for Local Running
     * @author TGTGamer
     * @since 1.0.0
     */
    log(
      LoggingLevels.debug,
      `Context for local running. See readme.md for information on how to setup local running: ${JSON.stringify(
        context
      )}`
    )
    /**
     * Process the config
     * @author TGTGamer
     * @since 1.1.0
     */
    log(LoggingLevels.debug, `Config: ${JSON.stringify(this.configJSON)}`)

    const configs = await this.processConfig().catch(err => {
      throw log(
        LoggingLevels.error,
        `Error thrown while processing config: `,
        err
      )
    })
    if (!configs.runners[0]) {
      throw log(LoggingLevels.error, `No config data.`)
    }

    if (configs.labels && this.util.shouldRun('label')) {
      /**
       * Syncronise the labels
       * @author TGTGamer
       * @since 1.1.0
       */
      core.startGroup('label Actions')
      log(LoggingLevels.debug, `Attempting to apply labels`)
      await this.syncLabels(configs).catch(err => {
        throw log(
          LoggingLevels.debug,
          `Error thrown while syncronising labels: `,
          err
        )
      })
      log(LoggingLevels.notice, `Successfully applied all labels`)
      core.endGroup()
    }

    // Run each release manager
    configs.runners.forEach(async config => {
      /**
       * Convert label ID's to Names
       * @author TGTGamer
       * @since 1.1.0
       */
      config.labels = Object.entries(
        configs.labels ? configs.labels : []
      ).reduce((acc: { [key: string]: string }, cur) => {
        acc[cur[0]] = cur[1].name
        return acc
      }, {})

      log(LoggingLevels.debug, `Config: ${JSON.stringify(config)}`)

      /**
       * Get the context
       * @author TGTGamer
       * @since 1.1.0
       */
      const curContext = await this.processContext(config).catch(err => {
        throw log(
          LoggingLevels.error,
          `Error thrown while processing context: `,
          err
        )
      })
      log(LoggingLevels.debug, `Current Context: ${JSON.stringify(curContext)}`)

      /**
       * Combine the Shared & Context.type Configs
       * @author TGTGamer
       * @since 1.1.0
       */

      for (let a in config.sharedConfig) {
        const action = a as SharedConfigIndex
        if (!action || (!config[curContext.type] && !this.fillEmpty)) return
        else if (!config[curContext.type]) config[curContext.type] = {}
        if (action == 'labels' && this.util.shouldRun('label')) {
          for (const label in config.sharedConfig.labels) {
            if (!config[curContext.type]!.labels)
              config[curContext.type]!.labels = {}
            if (!(label in config[curContext.type]!)) {
              const l = config.sharedConfig.labels[label]
              if (l) config[curContext.type]!.labels![label] = l
            }
          }
        } else if (
          (action === 'enforceConventions' &&
            this.util.shouldRun('convention')) ||
          (action === 'stale' && this.util.shouldRun('release'))
        ) {
          // @ts-expect-error - Property 'conventions' is missing in type 'Stale' but required in type 'EnforceConventions'
          config[curContext.type]![action] = config.sharedConfig[action]
        }
      }
      core.endGroup()
      this.applyContext(configs, config, curContext)
    })
  }

  /**
   * Get the configuration
   * @author IvanFon, TGTGamer, jbinda
   * @since 1.0.0
   */
  async processConfig(): Promise<Runners> {
    if (!this.configJSON?.runners[0]) {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`config not found at "${this.configPath}"`)
      }
      const pathConfig = await JSON.parse(
        fs.readFileSync(this.configPath).toString()
      )
      if (!pathConfig.releaseMastermind) return pathConfig
      else return pathConfig.releaseMastermind
    } else {
      return this.configJSON
    }
  }

  /**
   * Handle the context
   * @author IvanFon, TGTGamer, jbinda
   * @since 1.0.0
   */
  async processContext(config: Config) {
    let curContext: CurContext

    if (context.payload.pull_request) {
      /**
       * Pull Request Context
       * @author IvanFon, TGTGamer, jbinda
       * @since 1.0.0
       */
      const ctx = await PullRequests.parse(this.util, config, context).catch(
        err => {
          throw log(
            LoggingLevels.error,
            `Error thrown while parsing PR context: `,
            err
          )
        }
      )
      if (!ctx) {
        throw new LoggingDataClass(
          LoggingLevels.error,
          'Pull Request not found on context'
        )
      }
      log(LoggingLevels.debug, `PR context: ${JSON.stringify(ctx)}`)
      curContext = {
        type: 'pr',
        context: ctx
      }
    } else if (context.payload.issue) {
      /**
       * Issue Context
       * @author IvanFon, TGTGamer, jbinda
       * @since 1.0.0
       */
      const ctx = await Issues.parse(this.util, config, context).catch(err => {
        throw log(
          LoggingLevels.error,
          `Error thrown while parsing issue context: ` + err
        )
      })
      if (!ctx) {
        throw new Error('Issue not found on context')
      }
      log(LoggingLevels.debug, `issue context: ${JSON.stringify(ctx)}`)

      curContext = {
        type: 'issue',
        context: ctx
      }
    } else if (context.payload.project_card) {
      /**
       * Project Context
       * @author TGTGamer
       * @since 1.0.0
       */
      const ctx = await Project.parse(this.util, config, context).catch(err => {
        log(
          LoggingLevels.error,
          `Error thrown while parsing Project context: `,
          err
        )
        return err
      })
      if (!ctx) {
        throw new Error('Project Card not found on context')
      }
      log(LoggingLevels.debug, `Project Card context: ${JSON.stringify(ctx)}`)

      curContext = {
        type: 'project',
        context: ctx
      }
    } else if (context.payload.schedule) {
      /**
       * Project Schedule Context
       * @author TGTGamer
       * @since 1.0.0
       */
      const ctx = await Schedule.parse(context).catch(err => {
        log(
          LoggingLevels.error,
          `Error thrown while parsing Schedule context: `,
          err
        )
        return err
      })
      if (!ctx) {
        throw new Error('Schedule not found on context')
      }
      log(LoggingLevels.debug, `Schedule context: ${JSON.stringify(ctx)}`)

      curContext = {
        type: 'schedule',
        context: ctx
      }
    } else {
      /**
       * No Context
       * @author TGTGamer
       * @since 1.1.0
       */
      throw log(
        LoggingLevels.notice,
        `There is no context to parse: ${JSON.stringify(context.payload)}`
      )
    }
    return curContext
  }

  /**
   * Syncronise labels to repository
   * @author IvanFon, TGTGamer, jbinda
   * @since 1.0.0
   */
  async syncLabels(config: Runners) {
    const labels = Object.entries(config.labels ? config.labels : []).reduce(
      (acc: { [key: string]: Label }, cur) => {
        acc[cur[1].name.toLowerCase()] = cur[1]
        return acc
      },
      {}
    )

    await this.util.labels.sync(labels).catch(err => {
      log(
        LoggingLevels.error,
        `Error thrown while handling syncLabels tasks:`,
        err
      )
    })
  }

  applyContext(runners: Runners, config: Config, curContext: CurContext) {
    let ctx: PullRequests | Issues | Project | Schedule
    if (curContext.type == 'pr') {
      ctx = new PullRequests(
        this.util,
        runners,
        config,
        curContext,
        this.dryRun
      )
      ctx.run()
    } else if (curContext.type == 'issue') {
      ctx = new Issues(this.util, runners, config, curContext, this.dryRun)
      ctx.run().catch(err => {
        throw log(
          LoggingLevels.error,
          `Error thrown while running context: `,
          err
        )
      })
    } else if (curContext.type == 'project') {
      ctx = new Project(this.util, runners, config, curContext, this.dryRun)
      ctx.run().catch(err => {
        throw log(
          LoggingLevels.error,
          `Error thrown while running context: `,
          err
        )
      })
    } else if (curContext.type == 'schedule') {
      ctx = new Schedule(this.util, runners, config, curContext, this.dryRun)
      ctx.run().catch(err => {
        throw log(
          LoggingLevels.error,
          `Error thrown while running context: `,
          err
        )
      })
    }
  }
}
