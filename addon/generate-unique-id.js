/**
 * @return { String } a combination of timestamp and 5 random digits
 */
export default function generateUniqueId() {
  return (new Date()).getTime() +
         '-' +
         Math.random().toFixed(5).slice(2);
}


