'use strict';

function deepExtend(deep, target, ...sources) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (deep && value && typeof value === 'object' && !Array.isArray(value)) {
        target[key] = deepExtend(true, (target[key] && typeof target[key] === 'object') ? target[key] : {}, value);
      } else {
        target[key] = value;
      }
    }
  }
  return target;
}

function fakeJQueryElement() {
  return {
    is: () => false,
    prop: () => false,
    val: () => undefined,
    find: () => fakeJQueryElement(),
    text: () => undefined,
    attr: () => undefined,
    length: 0,
  };
}

function installDomStub() {
  function dollar(_selector) {
    return fakeJQueryElement();
  }
  dollar.extend = function (...args) {
    if (typeof args[0] === 'boolean') {
      const [deep, target, ...sources] = args;
      return deepExtend(deep, target, ...sources);
    }
    const [target, ...sources] = args;
    return deepExtend(false, target, ...sources);
  };
  dollar.isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;
  global.$ = dollar;
}

module.exports = { installDomStub, deepExtend };
