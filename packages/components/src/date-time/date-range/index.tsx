/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	isSameDay,
	subMonths,
	addMonths,
	startOfDay,
	isEqual,
	addDays,
	subWeeks,
	addWeeks,
	isSameMonth,
	startOfWeek,
	endOfWeek,
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
import Day from '../date/day';
import type { DatePickerProps } from '../types';
import {
	Wrapper,
	Navigator,
	NavigatorHeading,
	Calendar,
	DayOfWeek,
} from '../date/styles';
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
}: DatePickerProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const {
		calendar,
		viewing,
		setSelected,
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

	// Allows us to only programmatically focus() a day when focus was already
	// within the calendar. This stops us stealing focus from e.g. a TimePicker
	// input.
	const [ isFocusWithinCalendar, setIsFocusWithinCalendar ] =
		useState( false );

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
				onFocus={ () => setIsFocusWithinCalendar( true ) }
				onBlur={ () => setIsFocusWithinCalendar( false ) }
			>
				{ calendar[ 0 ][ 0 ].map( ( day ) => (
					<DayOfWeek key={ day.toString() }>
						{ dateI18n( 'D', day, -day.getTimezoneOffset() ) }
					</DayOfWeek>
				) ) }
				{ calendar[ 0 ].map( ( week ) =>
					week.map( ( day, index ) => {
						if ( ! isSameMonth( day, viewing ) ) {
							return null;
						}
						return (
							<Day
								key={ day.toString() }
								day={ day }
								column={ index + 1 }
								isSelected={ isSelected( day ) }
								isFocusable={ isEqual( day, focusable ) }
								isFocusAllowed={ isFocusWithinCalendar }
								isToday={ isSameDay( day, new Date() ) }
								isInvalid={
									isInvalidDate ? isInvalidDate( day ) : false
								}
								numEvents={
									events.filter( ( event ) =>
										isSameDay( event.date, day )
									).length
								}
								onClick={ () => {
									setSelected( [ day ] );
									setFocusable( day );
									onChange?.(
										format(
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
										)
									);
								} }
								onKeyDown={ ( event ) => {
									let nextFocusable;
									if ( event.key === 'ArrowLeft' ) {
										nextFocusable = addDays(
											day,
											isRTL() ? 1 : -1
										);
									}
									if ( event.key === 'ArrowRight' ) {
										nextFocusable = addDays(
											day,
											isRTL() ? -1 : 1
										);
									}
									if ( event.key === 'ArrowUp' ) {
										nextFocusable = subWeeks( day, 1 );
									}
									if ( event.key === 'ArrowDown' ) {
										nextFocusable = addWeeks( day, 1 );
									}
									if ( event.key === 'PageUp' ) {
										nextFocusable = subMonths( day, 1 );
									}
									if ( event.key === 'PageDown' ) {
										nextFocusable = addMonths( day, 1 );
									}
									if ( event.key === 'Home' ) {
										nextFocusable = startOfWeek( day );
									}
									if ( event.key === 'End' ) {
										nextFocusable = startOfDay(
											endOfWeek( day )
										);
									}
									if ( nextFocusable ) {
										event.preventDefault();
										setFocusable( nextFocusable );
										if (
											! isSameMonth(
												nextFocusable,
												viewing
											)
										) {
											setViewing( nextFocusable );
											onMonthPreviewed?.(
												format(
													nextFocusable,
													TIMEZONELESS_FORMAT
												)
											);
										}
									}
								} }
							/>
						);
					} )
				) }
			</Calendar>
		</Wrapper>
	);
}

export default DateRange;
