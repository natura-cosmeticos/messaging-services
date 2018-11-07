class CommandFactory {
  static createAndPromisify(Factory) {
    const fn = CommandFactory.executeCommandAsPromise.bind(null, Factory);

    fn.wrappedFactory = new Factory();

    return fn;
  }

  static executeCommandAsPromise(Factory, ...args) {
    const command = new Factory().create();

    return new Promise(async (resolve, reject) => {
      let success = false;

      command.on('success', () => {
        success = true;
      });
      await command.execute(...args);

      if (success) resolve();
      else reject();
    });
  }
}

module.exports = CommandFactory;
