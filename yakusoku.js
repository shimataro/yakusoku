class Yakusoku {
  static race(iterable) {
    return new Yakusoku((resolve, reject) => {
      for (const y of iterable) {
        // 最初に状態が変わったものを採用
        y.then(resolve, reject);
      }
    });
  }

  static all(iterable) {
    return new Yakusoku((resolve, reject) => {
      const resolvedValues = Array(iterable.length); // 結果を格納する配列
      let iterableIndex = 0; // 渡されたYakusokuオブジェクトの配列インデックス
      let fulfilledCounter = 0; // fulfilledになった数のカウンター

      for (const y of iterable) {
        const i = iterableIndex++; // 何番目のオブジェクトか記録しておく
        y.then((value) => {
          // fulfilledになったものを元の順番通りに格納
          resolvedValues[i] = value;
          fulfilledCounter++;
          if (fulfilledCounter >= iterable.length) {
            // 全てfulfilled
            resolve(resolvedValues);
          }
        }, reject); // 1つでもrejectedになったらYakusoku.all()の結果もrejected
      }
    });
  }

  constructor(func) {
    this.state = "pending"; // 内部状態; pending / fulfilled / rejected
    this.resolvedValue = null; // resolve()で渡された値を保持
    this.rejectedValue = null; // reject()で渡された値を保持
    this.thenFunctions = []; // then()に渡された関数を保持

    const resolve = (resolvedValue) => {
      if (this.state !== "pending") {
        return; // 内部状態の変更は一度だけ
      }
      this.state = "fulfilled";
      this.resolvedValue = resolvedValue;

      // then()に渡された関数を全て実行
      for (const thenFunction of this.thenFunctions) {
        try {
          const ret = thenFunction.onFulfilled(resolvedValue);
          if (isThenable(ret)) {
            // 戻り値がYakusokuオブジェクトならthen()に渡す
            ret.then(thenFunction.resolve, thenFunction.reject);
          }
          else {
            // Yakusokuオブジェクトでなければfulfilled
            thenFunction.resolve(ret);
          }
        }
        catch (err) {
          // 例外が発生したらrejected
          thenFunction.reject(err);
        }
      }
    };
    const reject = (rejectedValue) => {
      if (this.state !== "pending") {
        return; // 内部状態の変更は一度だけ
      }
      this.state = "rejected";
      this.rejectedValue = rejectedValue;

      // then()に渡された関数を全て実行
      for (const thenFunction of this.thenFunctions) {
        try {
          const ret = thenFunction.onRejected(rejectedValue);
          if (isThenable(ret)) {
            // 戻り値がYakusokuオブジェクトならthen()に渡す
            ret.then(thenFunction.resolve, thenFunction.reject);
          }
          else {
            // Yakusokuオブジェクトでなければfulfilled
            thenFunction.resolve(ret);
          }
        }
        catch (err) {
          // 例外が発生したらrejected
          thenFunction.reject(err);
        }
      }
    };

    try {
      func(resolve, reject);
    }
    catch (err) {
      // 例外が発生したらrejectedにする
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== "function") {
      onFulfilled = identity;
    }
    if (typeof onRejected !== "function") {
      onRejected = thrower;
    }

    if (this.state === "pending") {
      // pendingなら後で呼び出すので関数を記録しておく
      return new Yakusoku((resolve, reject) => {
        this.thenFunctions.push({ onFulfilled, onRejected, resolve, reject });
      });
    }
    if (this.state === "fulfilled") {
      return wrapWithYakusoku(onFulfilled(this.resolvedValue));
    }
    if (this.state === "rejected") {
      return wrapWithYakusoku(onRejected(this.rejectedValue));
    }
  }

  catch(onRejected) {
    return this.then(null, onRejected); // 1番目の引数をidentity functionにする
  }
}

function identity(value) { // identity function
  return value;
}

function thrower(err) { // thrower function
  throw err;
}

function isThenable(value) {
  if (value === null || value === undefined) {
    return false;
  }
  return typeof value.then === "function";
}

function wrapWithYakusoku(value) {
  if (isThenable(value)) {
    return value;
  }
  return new Yakusoku((resolve) => {
    resolve(value);
  });
}
