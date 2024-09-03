/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	subMonths,
	addMonths,
	startOfDay,
	isSameMonth,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Calendar from '../date/calendar';
import type { DateRangeProps } from '../types';
import { Wrapper, Navigator, NavigatorHeading } from '../date/styles';
import { inputToDate } from '../utils';
import Button from '../../button';
import { TIMEZONELESS_FORMAT } from '../constants';

/**
 * DateRange is a React component that renders a calendar for date range selection.
 *
 * ```jsx
 * import { DateRange } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDateRange = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DateRange
 *       rangeStart={ date }
 *       rangeEnd={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *     />
 *   );
 * };
 * ```
 */
export function DateRange( {
	currentDate, // used to focus the current date in the calendar
	onChange,
	events = [],
	isInvalidDate,
	onMonthPreviewed,
	startOfWeek: weekStartsOn = 0,
	rangeStart = null,
	rangeEnd = null,
}: DateRangeProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const {
		calendar,
		viewing,
		setViewing,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
		selectRange,
	} = useLilius( {
		selected: [],
		viewing: startOfDay( date ),
		weekStartsOn,
	} );

	useEffect( () => {
		if ( rangeStart && rangeEnd ) {
			selectRange(
				startOfDay( rangeStart ),
				startOfDay( rangeEnd ),
				true
			);
		}
	}, [ rangeStart, rangeEnd, selectRange ] );

	// Used to implement a roving tab index. Tracks the day that receives focus
	// when the user tabs into the calendar.
	const [ focusable, setFocusable ] = useState( startOfDay( date ) );

	// Update internal state when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setViewing( startOfDay( date ) );
		setFocusable( startOfDay( date ) );
	}

	return (
		<Wrapper
			className="components-datetime__date-range"
			role="application"
			aria-label={ __( 'Calendar' ) }
		>
			<Navigator>
				<Button
					icon={ isRTL() ? arrowRight : arrowLeft }
					variant="tertiary"
					aria-label={ __( 'View previous month' ) }
					onClick={ () => {
						viewPreviousMonth();
						setFocusable( subMonths( focusable, 1 ) );
						onMonthPreviewed?.(
							format(
								subMonths( viewing, 1 ),
								TIMEZONELESS_FORMAT
							)
						);
					} }
				/>
				<NavigatorHeading level={ 3 }>
					<strong>
						{ dateI18n(
							'F',
							viewing,
							-viewing.getTimezoneOffset()
						) }
					</strong>{ ' ' }
					{ dateI18n( 'Y', viewing, -viewing.getTimezoneOffset() ) }
				</NavigatorHeading>
				<Button
					icon={ isRTL() ? arrowLeft : arrowRight }
					variant="tertiary"
					aria-label={ __( 'View next month' ) }
					onClick={ () => {
						viewNextMonth();
						setFocusable( addMonths( focusable, 1 ) );
						onMonthPreviewed?.(
							format(
								addMonths( viewing, 1 ),
								TIMEZONELESS_FORMAT
							)
						);
					} }
				/>
			</Navigator>
			<Calendar
				calendar={ calendar }
				isInvalidDate={ isInvalidDate }
				viewing={ viewing }
				isSelected={ isSelected }
				events={ events }
				onDayClick={ ( day ) => {
					// TODO: Implement range selection.
					setFocusable( day );
					const newStartDate = format(
						// Don't change the selected date's time fields.
						new Date(
							day.getFullYear(),
							day.getMonth(),
							day.getDate(),
							date.getHours(),
							date.getMinutes(),
							date.getSeconds(),
							date.getMilliseconds()
						),
						TIMEZONELESS_FORMAT
					);
					const newEndDate = newStartDate;
					onChange?.( newStartDate, newEndDate );
				} }
				onDayKeyDown={ ( nextFocusable ) => {
					setFocusable( nextFocusable );
					if ( ! isSameMonth( nextFocusable, viewing ) ) {
						setViewing( nextFocusable );
						onMonthPreviewed?.(
							format( nextFocusable, TIMEZONELESS_FORMAT )
						);
					}
				} }
				focusable={ focusable }
			/>
		</Wrapper>
	);
}

export default DateRange;
