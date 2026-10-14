/**
 * Scheduling utilities and business validation rules for Biglang Gwapo
 */

export const STANDARD_SCHEDULES = [
  'Tue–Sun · 9:00 AM – 6:00 PM (Break: 1:00 PM – 2:00 PM · Rest: Mon)', // Default: Weekly rest day on Monday
  'Mon–Sat · 9:00 AM – 6:00 PM (Break: 1:00 PM – 2:00 PM · Rest: Sun)',
  'Mon–Fri & Sun · 10:00 AM – 7:00 PM (Break: 1:30 PM – 2:30 PM · Rest: Sat)',
  'Wed–Mon · 11:00 AM – 8:00 PM (Break: 2:30 PM – 3:30 PM · Rest: Tue)',
  'Mon–Fri · 9:00 AM – 5:00 PM (Break: 12:30 PM – 1:30 PM · Rest: Sat & Sun)',
  'Thu–Tue · 10:00 AM – 7:00 PM (Break: 1:30 PM – 2:30 PM · Rest: Wed)'
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_MAP = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6
};

/**
 * Converts a time string like "9:00 AM" or "5:30 PM" to minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const match = str.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to 12-hour AM/PM string format
 */
export function minutesToTime(minutes) {
  const mins = ((minutes % 1440) + 1440) % 1440;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Parses shop opening and closing hours from settings
 */
export function parseShopHours(hoursStr) {
  const fallback = { openMin: 540, closeMin: 1200, text: '9:00 AM – 8:00 PM' };
  if (!hoursStr) return fallback;
  const match = String(hoursStr).match(/(\d+:\d+\s*(?:AM|PM))\s*[–—-]\s*(\d+:\d+\s*(?:AM|PM))/i);
  if (!match) return fallback;
  const openMin = timeToMinutes(match[1]);
  const closeMin = timeToMinutes(match[2]);
  return {
    openMin,
    closeMin,
    text: `${match[1].trim()} – ${match[2].trim()}`
  };
}

/**
 * Parses any barber schedule string into structured times and rest days
 */
export function parseSchedule(scheduleStr) {
  const str = String(scheduleStr || STANDARD_SCHEDULES[0]);

  // 1. Extract Break if explicitly given
  let breakStartMin = 780; // 1:00 PM
  let breakEndMin = 840;   // 2:00 PM
  let breakText = '1:00 PM – 2:00 PM';

  const breakMatch = str.match(/Break:\s*(\d+:\d+\s*(?:AM|PM))\s*[–—-]\s*(\d+:\d+\s*(?:AM|PM))/i);
  if (breakMatch) {
    breakStartMin = timeToMinutes(breakMatch[1]);
    breakEndMin = timeToMinutes(breakMatch[2]);
    breakText = `${breakMatch[1].trim()} – ${breakMatch[2].trim()}`;
  }

  // 2. Extract Shift Hours (excluding the Break substring)
  let shiftStartMin = 540; // 9:00 AM
  let shiftEndMin = 1080;  // 6:00 PM
  let shiftText = '9:00 AM – 6:00 PM';

  const cleanedStr = str.replace(/Break:[^)]*/i, '');
  const timeMatch = cleanedStr.match(/(\d+:\d+\s*(?:AM|PM))\s*[–—-]\s*(\d+:\d+\s*(?:AM|PM))/i);
  if (timeMatch) {
    shiftStartMin = timeToMinutes(timeMatch[1]);
    shiftEndMin = timeToMinutes(timeMatch[2]);
    shiftText = `${timeMatch[1].trim()} – ${timeMatch[2].trim()}`;
  }

  // If no break was explicitly defined, default to 1:00 PM - 2:00 PM if within shift
  if (!breakMatch) {
    if (shiftStartMin <= 780 && shiftEndMin >= 840) {
      breakStartMin = 780;
      breakEndMin = 840;
      breakText = '1:00 PM – 2:00 PM';
    } else {
      const mid = Math.floor((shiftStartMin + shiftEndMin) / 2);
      breakStartMin = mid - 30;
      breakEndMin = mid + 30;
      breakText = `${minutesToTime(breakStartMin)} – ${minutesToTime(breakEndMin)}`;
    }
  }

  // 3. Extract Rest Days
  const restDays = [];
  const restMatch = str.match(/Rest:\s*([A-Za-z\s&,]+)/i);
  if (restMatch) {
    const parts = restMatch[1].split(/[\s&,]+/).filter(Boolean);
    parts.forEach((part) => {
      const key = part.toLowerCase().slice(0, 3);
      if (DAY_MAP[key] !== undefined && !restDays.includes(DAY_MAP[key])) {
        restDays.push(DAY_MAP[key]);
      }
    });
  }

  // Infer rest days from day range if not explicitly formatted with Rest:
  if (restDays.length === 0) {
    if (/Tue[–—-]Sun/i.test(str)) {
      restDays.push(1); // Mon
    } else if (/Mon[–—-]Sat/i.test(str)) {
      restDays.push(0); // Sun
    } else if (/Wed[–—-]Mon/i.test(str)) {
      restDays.push(2); // Tue
    } else if (/Thu[–—-]Tue/i.test(str)) {
      restDays.push(3); // Wed
    } else if (/Mon[–—-]Fri/i.test(str)) {
      restDays.push(6, 0); // Sat, Sun
    }
  }

  const restDayNames = restDays.map((d) => DAY_NAMES[d]);
  const hasWeeklyRestDay = restDays.length > 0;

  return {
    shiftStartMin,
    shiftEndMin,
    shiftText,
    breakStartMin,
    breakEndMin,
    breakText,
    restDays,
    restDayNames,
    hasWeeklyRestDay,
    raw: str
  };
}

/**
 * Validates that shift times fall strictly within the barbershop's opening and closing hours
 * and enforces at least one weekly rest day.
 */
export function validateShiftWithinShopHours(scheduleStr, shopHoursStr) {
  const shop = parseShopHours(shopHoursStr);
  const shift = parseSchedule(scheduleStr);

  if (!shift.hasWeeklyRestDay) {
    return {
      valid: false,
      error: 'Every barber schedule must include at least one weekly rest day (e.g. Rest: Mon). Continuous 7-day shifts are not permitted.'
    };
  }

  if (shift.shiftStartMin < shop.openMin || shift.shiftEndMin > shop.closeMin) {
    return {
      valid: false,
      error: `Shift hours (${shift.shiftText}) must be within the shop's operating hours (${shop.text}).`
    };
  }

  if (shift.shiftStartMin >= shift.shiftEndMin) {
    return {
      valid: false,
      error: 'Shift start time must be earlier than shift end time.'
    };
  }

  if (shift.breakStartMin < shift.shiftStartMin || shift.breakEndMin > shift.shiftEndMin) {
    return {
      valid: false,
      error: `Break time (${shift.breakText}) must be within the shift hours (${shift.shiftText}).`
    };
  }

  return { valid: true, shift, shop };
}

/**
 * Checks whether a given date is a weekly rest day for the barber
 */
export function isRestDay(barber, dateStr) {
  if (!barber || !dateStr) return { isRest: false, dayName: '' };
  const shift = parseSchedule(barber.schedule);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...
  const dayName = DAY_NAMES[dayOfWeek];
  const isRest = shift.restDays.includes(dayOfWeek);
  return { isRest, dayName, restDayNames: shift.restDayNames };
}

/**
 * Checks whether the barber is currently on approved leave (Sick Leave, Vacation Leave, Day Off, Inactive)
 */
export function isBarberOnLeave(barber) {
  if (!barber) return { onLeave: false, reason: '' };
  const leave = barber.leaveStatus || barber.status;
  if (['Sick Leave', 'Vacation Leave', 'Day Off', 'Inactive'].includes(leave) || barber.working === false) {
    return {
      onLeave: true,
      reason: leave || 'On leave'
    };
  }
  return { onLeave: false, reason: '' };
}

/**
 * Checks if a specific slot can accommodate the requested service without
 * overlapping breaks, exceeding shift end, or conflicting with existing bookings.
 */
export function getSlotAvailability(slotTime, serviceDuration, barber, dateStr, appointments = [], excludeAptId = null) {
  if (!barber) return { available: false, reason: 'No barber' };

  // 1. Approved time off / leave check
  const leaveCheck = isBarberOnLeave(barber);
  if (leaveCheck.onLeave) {
    return { available: false, reason: leaveCheck.reason };
  }

  // 2. Rest day check
  const restCheck = isRestDay(barber, dateStr);
  if (restCheck.isRest) {
    return { available: false, reason: 'Rest day' };
  }

  const shift = parseSchedule(barber.schedule);
  const startMin = timeToMinutes(slotTime);
  const duration = Number(serviceDuration) || 45;
  const endMin = startMin + duration;

  // 3. Shift boundary check: start >= shiftStart AND end <= shiftEnd
  if (startMin < shift.shiftStartMin) {
    return { available: false, reason: 'Before shift' };
  }
  if (endMin > shift.shiftEndMin) {
    return { available: false, reason: 'Exceeds shift' };
  }

  // 4. Break time check: appointment must NOT overlap break time
  if (startMin < shift.breakEndMin && endMin > shift.breakStartMin) {
    return { available: false, reason: 'Break' };
  }

  // 5. Existing appointments overlap check
  const hasOverlap = (appointments || []).some((apt) => {
    if (excludeAptId && apt.id === excludeAptId) return false;
    if (apt.barberId !== barber.id) return false;
    if (apt.date !== dateStr) return false;
    if (['Cancelled', 'No-show'].includes(apt.status)) return false;

    const aptStart = timeToMinutes(apt.time);
    const aptDuration = Number(apt.duration) || 45;
    const aptEnd = aptStart + aptDuration;

    return startMin < aptEnd && endMin > aptStart;
  });

  if (hasOverlap) {
    return { available: false, reason: 'Booked' };
  }

  return { available: true, reason: 'Available' };
}

/**
 * Identifies any existing active appointments that will conflict with a newly proposed shift schedule
 */
export function findShiftConflicts(barber, newScheduleStr, appointments = []) {
  if (!barber || !newScheduleStr) return [];
  const newShift = parseSchedule(newScheduleStr);

  const activeApts = (appointments || []).filter((apt) =>
    apt.barberId === barber.id && !['Completed', 'Cancelled', 'No-show'].includes(apt.status)
  );

  const conflicts = [];

  activeApts.forEach((apt) => {
    if (!apt.date || !apt.time) return;

    // Check rest day conflict
    const [y, m, d] = apt.date.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    if (newShift.restDays.includes(dayOfWeek)) {
      conflicts.push({
        apt,
        reason: `Falls on new weekly rest day (${DAY_NAMES[dayOfWeek]})`
      });
      return;
    }

    // Check shift hours conflict
    const startMin = timeToMinutes(apt.time);
    const duration = Number(apt.duration) || 45;
    const endMin = startMin + duration;

    if (startMin < newShift.shiftStartMin) {
      conflicts.push({
        apt,
        reason: `Starts before new shift begins at ${minutesToTime(newShift.shiftStartMin)}`
      });
      return;
    }
    if (endMin > newShift.shiftEndMin) {
      conflicts.push({
        apt,
        reason: `Ends at ${minutesToTime(endMin)}, which exceeds new shift end (${minutesToTime(newShift.shiftEndMin)})`
      });
      return;
    }

    // Check break overlap conflict
    if (startMin < newShift.breakEndMin && endMin > newShift.breakStartMin) {
      conflicts.push({
        apt,
        reason: `Overlaps new break time (${newShift.breakText})`
      });
      return;
    }
  });

  return conflicts;
}
