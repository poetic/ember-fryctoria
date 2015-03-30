export default function isModelInstance(val) {
  return val && val.get && val.get('constructor.typeKey');
}
