import DialogManager from '..';

beforeEach(() => {
  DialogManager.init('test');
});

describe('DialogManager', () => {
  test('show 打开弹窗', () => {
    const dialogs = {
      // 打开弹窗的名字
      showDialogName: '',
      data: null,
    };

    DialogManager.on('show', ({ name = '', data = {} }) => {
      name = name;
      dialogs.showDialogName = name;
      dialogs.data = data;
    });

    DialogManager.show({
      name: 'dialogA',
      data: { prop: 'Hello' },
    });

    expect(dialogs).toEqual({
      showDialogName: 'dialogA',
      data: { prop: 'Hello' },
    });
  });

  test('close 关闭弹窗', () => {
    let dialogs: Record<string, any> = {
      showDialogName: 'dialogA',
      data: { prop: 'xx' },
    };

    let closeData = {};
    DialogManager.on('close', (dialogInfo, payload) => {
      closeData = payload;
      dialogs = { showDialogName: '', data: {} };
    });

    DialogManager.close({ trigger: 'xxx' });
    expect(dialogs).toEqual({ showDialogName: '', data: {} });
    expect(closeData).toEqual({ trigger: 'xxx' });
  });

  test('链式操作', () => {
    const showFn = jest.fn();
    const closeFn = jest.fn();
    DialogManager.on('show', showFn).on('close', closeFn);

    DialogManager.show({ name: 'xxx' });
    DialogManager.close();

    expect(showFn).toBeCalledTimes(1);
    expect(closeFn).toBeCalledTimes(1);
  });
});
