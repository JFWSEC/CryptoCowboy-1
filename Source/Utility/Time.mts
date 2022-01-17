function Time()
{
	const Multiply = (a: number) => (b: number) => a * b;

	const second = 1000;
	const seconds = Multiply(second);

	const minute = seconds(60);
	const minutes = Multiply(minute);

	const hour = minutes(60);
	const hours = Multiply(hour);

	const day = hours(24);
	const days = Multiply(day);

	const week = days(7);
	const weeks = Multiply(week);

	return { second, minute, hour, day, week, seconds, minutes, hours, days, weeks };
}

export default Time();


// .map(Multiply)