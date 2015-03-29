/**
 * @return { String } a combination of timestamp and 5 random digits
 */
export default function generateUniqueId() {
  var prefix = 'fryctoria';
  var time = (new Date()).getTime();
  var randomFiveDigits = Math.random().toFixed(5).slice(2);
  return [prefix, time, randomFiveDigits].join('-');
}


