class Yakusoku {
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
        thenFunction.onFulfilled(resolvedValue);
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
        thenFunction.onRejected(rejectedValue);
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
      this.thenFunctions.push({ onFulfilled, onRejected });
    }
    if (this.state === "fulfilled") {
      onFulfilled(this.resolvedValue);
    }
    if (this.state === "rejected") {
      onRejected(this.rejectedValue);
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
