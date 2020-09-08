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
}
