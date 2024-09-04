/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DateRange from '../date-range';
import { daysFromNow, isWeekend } from './utils';
import { inputToDate } from '../utils';

const meta: Meta< typeof DateRange > = {
	title: 'Components/DateRange',
	component: DateRange,
	argTypes: {
		currentDate: { control: 'date' },
		onChange: { action: 'onChange', control: { type: null } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof DateRange > = ( {
	currentDate,
	onChange,
	...args
} ) => {
	const [ date, setDate ] = useState( currentDate );
	const [ rangeEnd, setRangeEnd ] = useState< Date | null >( null );
	const [ rangeStart, setRangeStart ] = useState< Date | null >( null );

	useEffect( () => {
		setDate( currentDate );
		if ( ! args.rangeStart || ! args.rangeEnd ) {
			return;
		}
		setRangeEnd( inputToDate( args.rangeEnd ) );
		setRangeStart( inputToDate( args.rangeStart ) );
	}, [ args.rangeStart, args.rangeEnd, currentDate ] );

	useEffect( () => {
		setDate( currentDate );
	}, [ currentDate ] );
	return (
		<DateRange
			{ ...args }
			rangeEnd={ rangeEnd }
			rangeStart={ rangeStart }
			currentDate={ date }
			onChange={ ( startDate, endDate ) => {
				setDate( startDate );
				setRangeEnd( endDate );
				setRangeStart( startDate );
				onChange?.( startDate, endDate );
			} }
		/>
	);
};

export const Default: StoryFn< typeof DateRange > = Template.bind( {} );

export const WithEvents: StoryFn< typeof DateRange > = Template.bind( {} );
WithEvents.args = {
	currentDate: new Date(),
	events: [
		{ date: daysFromNow( 2 ) },
		{ date: daysFromNow( 4 ) },
		{ date: daysFromNow( 6 ) },
		{ date: daysFromNow( 8 ) },
	],
};

export const WithInvalidDates: StoryFn< typeof DateRange > = Template.bind(
	{}
);
WithInvalidDates.args = {
	currentDate: new Date(),
	isInvalidDate: isWeekend,
};

export const WithRange: StoryFn< typeof DateRange > = Template.bind( {} );
WithRange.args = {
	currentDate: new Date(),
	rangeStart: daysFromNow( 2 ),
	rangeEnd: daysFromNow( 8 ),
};
