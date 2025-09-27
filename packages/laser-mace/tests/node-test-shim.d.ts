declare module 'node:test' {
  const test: any;
  export default test;
}
declare module 'node:assert' {
  import assert = require('assert');
  export = assert;
}
