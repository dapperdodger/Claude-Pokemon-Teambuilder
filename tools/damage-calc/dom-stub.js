'use strict';

function isPlainObjectLike(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepExtend(deep, target, ...sources) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of Object.keys(source)) {
      const copy = source[key];
      if (copy === target) continue;

      const copyIsArray = Array.isArray(copy);
      if (deep && copy && typeof copy === 'object' && (copyIsArray || isPlainObjectLike(copy))) {
        // Mirror real jQuery $.extend(true, ...) semantics: an array source
        // recurses index-wise (merging target[key][i] with source[key][i]
        // for each index present in the SOURCE), rather than being replaced
        // wholesale or naively concatenated. Indices in the target array
        // beyond the source array's length are left untouched, since the
        // recursive merge below only iterates the source's own keys.
        const existing = target[key];
        let base;
        if (copyIsArray && !Array.isArray(existing)) {
          base = [];
        } else if (!copyIsArray && !isPlainObjectLike(existing)) {
          base = {};
        } else {
          base = existing;
        }
        target[key] = deepExtend(true, base, copy);
      } else {
        target[key] = copy;
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
