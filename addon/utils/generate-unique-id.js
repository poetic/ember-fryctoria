/**
 * @return { String } a combination of timestamp and 5 random digits
 */
export default function generateUniqueId(prefix) {
  var time, randomFiveDigits;

  prefix           = prefix || 'fryctoria';
  time             = (new Date()).getTime();
  randomFiveDigits = Math.random().toFixed(5).slice(2);
  return [prefix, time, randomFiveDigits].join('-');
}


