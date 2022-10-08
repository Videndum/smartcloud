/**
 * Project: @resnovas/smartcloud
 * File: isOpen.ts
 * Path: \src\conditions\util\isOpen.ts
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

const type = 'isOpen';

enum States {
	Open = 'OPEN',
	Closed = 'CLOSED',
}

export type ConditionIsOpen = {
	type: typeof type;
	condition: boolean;
};

/** Checks if an issue or pull request is open or closed.
@examples require(".").example
Example:

```json
{
	"type": "isOpen",
	"condition": true
}
``` */

function isOpen(this: UtilThis, condition: ConditionIsOpen, issue: UtilProps) {
	return (
		this.util.parsingData.normalize(issue.state)
		=== this.util.parsingData.normalize(
			condition.condition ? States.Open : States.Closed,
		)
	);
}

export default [type, isOpen] as const;
export const example: ConditionIsOpen = {type, condition: true};
