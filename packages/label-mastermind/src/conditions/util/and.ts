import { UtilProps, UtilThis } from '../'
import {
  IssueConditionConfig,
  PRConditionConfig,
  ProjectConditionConfig
} from '../../../types'
import { evaluator } from '../../evaluator'
const TYPE = '$and'

export interface ConditionAnd {
  type: typeof TYPE
  pattern: [PRConditionConfig | IssueConditionConfig | ProjectConditionConfig]
}

function and(this: UtilThis, condition: ConditionAnd, props: UtilProps) {
  let success: number = 0
  condition.pattern.forEach(condition => {
    if (evaluator.call(this, condition, props)) success++
  })

  return success == condition.pattern.length
}

export default [TYPE, and] as const
