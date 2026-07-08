//gregorian calendar & locale
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import persian_en from 'react-date-object/locales/persian_en';
import { DateObject } from 'react-multi-date-picker';
export const convertDatePer = (date: string, showHour?: boolean) => {
  const options = showHour
    ? { hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: 'long', day: 'numeric' };
  if (showHour) {
    //    @ts-expect-error error
    return new Date(date).toLocaleTimeString('fa-IR', options);
  } else {
    // @ts-expect-error error
    return new Date(date).toLocaleString('fa-IR', options);
  }
};

export const converDateGre = (date: string, format?: string) => {
  if (date && date !== 'undefined') {
    const date1 = new DateObject({ calendar: persian, locale: persian_fa, date })
      .convert(gregorian, gregorian_en)
      .format(format ? format : '');
    return date1;
  }
  return '';
};
export const converTime = (date: string) => {
  const date1 = new DateObject(date);
  const birth_date = date1.convert(persian, persian_fa).format('HH:mm');
  return birth_date;
};

export const converDatePer = (date: string, format?: string) => {
  if (date) {
    const date1 = new DateObject(date);
    const birth_date = date1.convert(persian, persian_en).format(format);
    return birth_date;
  } else {
    return '';
  }
};

export const addCommas = (num: number | string) => {
  if (num.toString() === '0') {
    return '0';
  } else {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

export const removeNumNumeric = (num: number | string) => {
  if (num) {
    if (num?.toString() === '0') {
      return '0';
    } else {
      return num.toString().replace(/[^0-9]/g, '');
    }
  } else {
    return ' ';
  }
};
