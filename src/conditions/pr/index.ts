/**
 * Project: @resnovas/smartcloud
 * File: index.ts
 * Path: \src\conditions\pr\index.ts
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

import type {Issues, Project, PullRequests} from '../../contexts';
import type {Condition} from '../util';
import {handlers as sharedHandlers} from '../util';
import type {ConditionBranchMatches} from './branch-matches';
import branchMatches from './branch-matches';
import type {ConditionChangesSize} from './changes-size';
import changesSize from './changes-size';
import type {ConditionFilesMatch} from './files-match';
import filesMatch from './files-match';
import type {ConditionisApproved} from './is-approved';
import isApproved from './is-approved';
import type {ConditionIsDraft} from './is-draft';
import isDraft from './is-draft';
import type {ConditionPendingReview} from './pending-review';
import pendingReview from './pending-review';
import type {ConditionRequestedChanges} from './requested-changes';
import requestedChanges from './requested-changes';

export type PrCondition =
	| Condition
	| ConditionBranchMatches
	| ConditionFilesMatch
	| ConditionIsDraft
	| ConditionChangesSize
	| ConditionPendingReview
	| ConditionRequestedChanges
	| ConditionisApproved;

const handlers = [
	...sharedHandlers,
	branchMatches,
	filesMatch,
	isDraft,
	changesSize,
	pendingReview,
	requestedChanges,
	isApproved,
];

export function getPrConditionHandler(
	this: Issues | PullRequests | Project,
	condition: PrCondition,
) {
	const handler = handlers.find(handler => handler[0] === condition.type);
	return handler?.[1];
}
