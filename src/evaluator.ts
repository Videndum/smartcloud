/** @format */

import { LoggingDataClass, LoggingLevels } from "@resnovas/utilities"
import {
	getIssueConditionHandler,
	getPRConditionHandler,
	getProjectConditionHandler,
	IssueCondition,
	IssueConditionConfig,
	log,
	PRCondition,
	PRConditionConfig,
	ProjectCondition,
	ProjectConditionConfig,
	UtilProps,
	UtilThis
} from "./conditions"
import { Issues, Project, PullRequests } from "./contexts"
import { SharedConventionsConfig } from "./contexts/methods/conventions"
import { Release } from "./contexts/methods/release"

const forConditions = async <
	T extends IssueCondition | PRCondition | ProjectCondition
>(
	conditions: T[],
	callback: (condition: T) => boolean
) => {
	let matches = 0
	for (const condition of conditions) {
		const callbackRes = await callback(condition)
		log(
			LoggingLevels.debug,
			`Condition: ${JSON.stringify(condition)} == ${callbackRes}`
		)
		if (callbackRes) {
			matches++
		}
	}
	return matches
}

export async function evaluator(
	this: UtilThis,
	config:
		| PRConditionConfig
		| IssueConditionConfig
		| ProjectConditionConfig
		| SharedConventionsConfig
		| Release,
	props: UtilProps
) {
	const { condition, requires } = config
	log(LoggingLevels.debug, JSON.stringify(config))
	if (typeof condition == "string")
		throw new LoggingDataClass(
			LoggingLevels.error,
			"String can not be used to evaluate conditions"
		)
	/**
	 * TODO: fix this error
	 */
	// @ts-expect-error - an issue with conditions but dont know how to fix
	const matches = await forConditions(condition, async (condition) => {
		const handler =
			props.type == "issue"
				? getIssueConditionHandler.call(
						this as Issues,
						condition as IssueCondition
				  )
				: props.type == "pr"
				? getPRConditionHandler.call(
						this as PullRequests,
						condition as PRCondition
				  )
				: getProjectConditionHandler.call(
						this as Project,
						condition as ProjectCondition
				  )
		log(LoggingLevels.debug, `The handler is ${handler?.name}`)
		// @ts-expect-error
		return handler?.call(this, condition as any, props as any) as boolean
	})
	log(LoggingLevels.debug, `Matches: ${matches}/${requires}`)
	return matches >= requires
}
