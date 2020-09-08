class Yakusoku {
  constructor(func) {
    this.state = "pending"; // 内部状態; pending / fulfilled / rejected
    this.resolvedValue = null; // resolve()で渡された値を保持
    this.rejectedValue = null; // reject()で渡された値を保持

    const resolve = (resolvedValue) => {
      if (this.state !== "pending") {
        return; // 内部状態の変更は一度だけ
      }
      this.state = "fulfilled";
      this.resolvedValue = resolvedValue;
    };
    const reject = (rejectedValue) => {
      if (this.state !== "pending") {
        return; // 内部状態の変更は一度だけ
      }
      this.state = "rejected";
      this.rejectedValue = rejectedValue;
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
