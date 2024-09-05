/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	startOfDay,
	isSameMonth,
	isBefore,
	isAfter,
	isSameDay,
	intervalToDuration,
	addMonths,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Calendar from '../date/calendar';
import type { DateRangeProps } from '../types';
import { Wrapper } from '../date/styles';
import { inputToDate } from '../utils';
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
	numberOfMonths = 2,
}: DateRangeProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const [ startDate, setStartDate ] = useState< Date | null >( null );
	const [ endDate, setEndDate ] = useState< Date | null >( null );
	const [ prevStartDate, setPrevStartDate ] = useState< Date | null >();
	const [ prevEndDate, setPrevEndDate ] = useState< Date | null >();

	const {
		calendar,
		viewing,
		setViewing,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
		selectRange,
		select,
		clearSelected,
	} = useLilius( {
		selected: [],
		viewing: startOfDay( date ),
		weekStartsOn,
		numberOfMonths,
	} );

	// Update internal state when rangeStart or rangeEnd props change.
	useEffect( () => {
		if (
			rangeStart &&
			( ! startDate || ! isSameDay( rangeStart, startDate ) )
		) {
			setStartDate( inputToDate( rangeStart ) );
		}
		if ( rangeEnd && ( ! endDate || ! isSameDay( rangeEnd, endDate ) ) ) {
			setEndDate( inputToDate( rangeEnd ) );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ rangeStart, rangeEnd ] );

	useEffect( () => {
		// Switch dates
		if ( startDate && endDate && isBefore( endDate, startDate ) ) {
			setStartDate( endDate );
			setEndDate( startDate );
			return;
		}

		// If no range is selected, deselect the previous range
		if ( ! startDate || ! endDate ) {
			clearSelected();
		}

		// Start and end dates need to be always select if not empty
		if ( startDate ) {
			select( startDate );
		}
		if ( endDate ) {
			select( endDate );
		}

		// If there is a range and the reange changed, select the new range
		if (
			startDate &&
			endDate &&
			( ! prevStartDate ||
				! isSameDay( startDate, prevStartDate ) ||
				! prevEndDate ||
				! isSameDay( endDate, prevEndDate ) )
		) {
			selectRange( startOfDay( startDate ), startOfDay( endDate ), true );
			onChange?.( startOfDay( startDate ), startOfDay( endDate ) );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ startDate, endDate ] );

	// Used to implement a roving tab index. Tracks the day that receives focus
	// when the user tabs into the calendar.
	const [ focusable, setFocusable ] = useState( startOfDay( date ) );

	// Update internal state when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setViewing( startOfDay( date ) );
		setFocusable( startOfDay( date ) ); // TODO: look at focusable later.
	}

	return (
		<Wrapper
			className="components-datetime__date-range"
			role="application"
			aria-label={ __( 'Date Range' ) }
		>
			{ calendar.map( ( month, index ) => {
				return (
					<Calendar
						key={ index }
						calendar={ [ month ] }
						calendarIndex={ index }
						events={ events }
						numberOfMonths={ numberOfMonths }
						isInvalidDate={ isInvalidDate }
						isSelected={ isSelected }
						onMonthPreviewed={ onMonthPreviewed }
						setFocusable={ setFocusable }
						viewing={ addMonths( viewing, index ) }
						viewPreviousMonth={ viewPreviousMonth }
						viewNextMonth={ viewNextMonth }
						onDayClick={ ( day ) => {
							let newStartDate = startDate,
								newEndDate = endDate,
								daysFromStartDate,
								daysFromEndDate;

							if ( newStartDate && newEndDate ) {
								daysFromStartDate = intervalToDuration( {
									start: newStartDate,
									end: day,
								} );
								daysFromEndDate = intervalToDuration( {
									start: day,
									end: newEndDate,
								} );
							}

							if (
								newStartDate &&
								isSameDay( day, newStartDate )
							) {
								newStartDate = null;
							} else if (
								newEndDate &&
								isSameDay( day, newEndDate )
							) {
								newEndDate = null;
							} else if ( ! newStartDate ) {
								newStartDate = day;
							} else if ( ! newEndDate ) {
								newEndDate = day;
							} else if ( isBefore( day, newStartDate ) ) {
								newStartDate = day;
							} else if ( isAfter( day, newEndDate ) ) {
								newEndDate = day;
							} else if (
								daysFromStartDate?.days &&
								daysFromEndDate?.days &&
								daysFromStartDate.days < daysFromEndDate.days
							) {
								newStartDate = day;
							} else {
								newEndDate = day;
							}

							setPrevStartDate( startDate );
							setPrevEndDate( endDate );

							setStartDate( newStartDate );
							setEndDate( newEndDate );
						} }
						onDayKeyDown={ ( nextFocusable ) => {
							if ( ! isSameMonth( nextFocusable, viewing ) ) {
								setViewing( nextFocusable );
								onMonthPreviewed?.(
									format( nextFocusable, TIMEZONELESS_FORMAT )
								);
							}
						} }
						focusable={ focusable }
					/>
				);
			} ) }
		</Wrapper>
	);
}

export default DateRange;
