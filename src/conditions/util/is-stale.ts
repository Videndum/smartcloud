/**
 * Project: @resnovas/smartcloud
 * File: is-stale.ts
 * Path: \src\conditions\util\is-stale.ts
 * Created Date: Monday, September 5th 2022
 * Author: Jonathan Stevens
 * -----
 * Last Modified: Sun Sep 25 2022
 * Modified By: Jonathan Stevens
 * Current Version: 1.0.0-beta.0
 * -----
 * Copyright (c) 2022 Resnovas - All Rights Reserved
 * -----
 * LICENSE: GNU General Public License v3.0 or later (GPL-3.0+)
 *
 * This program has been provided under confidence of the copyright holder and is
 * licensed for copying, distribution and modification under the terms of
 * the GNU General Public License v3.0 or later (GPL-3.0+) published as the License,
 * or (at your option) any later version of this license.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License v3.0 or later for more details.
 *
 * You should have received a copy of the GNU General Public License v3.0 or later
 * along with this program. If not, please write to: jonathan@resnovas.com ,
 * or see https://www.gnu.org/licenses/gpl-3.0-standalone.html
 *
 * DELETING THIS NOTICE AUTOMATICALLY VOIDS YOUR LICENSE - PLEASE SEE THE LICENSE FILE FOR DETAILS
 * -----
 * HISTORY:
 * Date      	By	Comments
 * ----------	---	---------------------------------------------------------
 */

import type {UtilProps, UtilThis} from '..';

const type = 'isStale';

export type ConditionIsStale = {
	type: typeof type;
	condition: number;
};

/** Checks if an issue or pull request is stale.

Example:
@examples require(".").example
```json
{
	"type": "isStale",
	"condition": 30
}
``` */

function isStale(
	this: UtilThis,
	condition: ConditionIsStale,
	context: UtilProps,
) {
	let test;
	switch (context.type) {
		case 'issue':
			test = context.issue.updated_at;
			break;
		case 'pr':
			test = context.pull_request.updated_at;
			break;
		default:
			break;
	}

	if (!test) {
		return false;
	}

	const last = new Date(test);
	last.setDate(last.getDate() + condition.condition);
	const now = new Date();
	return last >= now;
}

export default [type, isStale] as const;
export const example: ConditionIsStale = {type,	condition: 30};
