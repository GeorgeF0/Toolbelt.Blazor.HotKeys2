export var Toolbelt;
(function (Toolbelt) {
    var Blazor;
    (function (Blazor) {
        var HotKeys2;
        (function (HotKeys2) {
            const doc = document;
            const OnKeyDownMethodName = "OnKeyDown";
            const NonTextInputTypes = ["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit",];
            const InputTagName = "INPUT";
            const FluentInputTagName = "FLUENT-TEXT-FIELD";
            const TextAreaTagName = "TEXTAREA";
            const FluentTextAreaTagName = "FLUENT-TEXT-AREA";
            const keydown = "keydown";
            class HotkeyEntry {
                constructor(dotNetObj, mode, modifiers, keyEntry, exclude, excludeSelector, isDisabled) {
                    this.dotNetObj = dotNetObj;
                    this.mode = mode;
                    this.modifiers = modifiers;
                    this.keyEntry = keyEntry;
                    this.exclude = exclude;
                    this.excludeSelector = excludeSelector;
                    this.isDisabled = isDisabled;
                }
                action() {
                    this.dotNetObj.invokeMethodAsync('InvokeAction');
                }
            }
            const addKeyDownEventListener = (listener) => doc.addEventListener(keydown, listener);
            const removeKeyDownEventListener = (listener) => doc.removeEventListener(keydown, listener);
            const convertToKeyName = (ev) => {
                const convertToKeyNameMap = {
                    "OS": "Meta",
                    "Decimal": "Period",
                };
                return convertToKeyNameMap[ev.key] || ev.key;
            };
            const startsWith = (str, prefix) => str.startsWith(prefix);
            const isExcludeTarget = (entry, targetElement, tagName, type) => {
                if ((entry.exclude & 1) !== 0) {
                    if ((tagName === InputTagName || tagName === FluentInputTagName) && NonTextInputTypes.every(t => t !== type))
                        return true;
                }
                if ((entry.exclude & 2) !== 0) {
                    if (tagName === InputTagName && NonTextInputTypes.some(t => t === type))
                        return true;
                }
                if ((entry.exclude & 4) !== 0) {
                    if (tagName === TextAreaTagName || tagName === FluentTextAreaTagName)
                        return true;
                }
                if ((entry.exclude & 8) !== 0) {
                    if (targetElement.isContentEditable)
                        return true;
                }
                if (entry.excludeSelector !== '' && targetElement.matches(entry.excludeSelector))
                    return true;
                return false;
            };
            const createKeydownHandler = (callback) => {
                return (ev) => {
                    if (typeof (ev["altKey"]) === 'undefined')
                        return;
                    const modifiers = (ev.shiftKey ? 1 : 0) +
                        (ev.ctrlKey ? 2 : 0) +
                        (ev.altKey ? 4 : 0) +
                        (ev.metaKey ? 8 : 0);
                    const key = convertToKeyName(ev);
                    const code = ev.code;
                    const targetElement = ev.target;
                    const tagName = targetElement.tagName;
                    const type = targetElement.getAttribute('type');
                    const preventDefault = callback(modifiers, key, code, targetElement, tagName, type);
                    if (preventDefault)
                        ev.preventDefault();
                };
            };
            HotKeys2.createContext = () => {
                let idSeq = 0;
                const hotKeyEntries = new Map();
                const onKeyDown = (modifiers, key, code, targetElement, tagName, type) => {
                    let preventDefault = false;
                    hotKeyEntries.forEach(entry => {
                        if (!entry.isDisabled) {
                            const byCode = entry.mode === 1;
                            const eventKeyEntry = byCode ? code : key;
                            const keyEntry = entry.keyEntry;
                            if (keyEntry !== eventKeyEntry)
                                return;
                            const eventModkeys = byCode ? modifiers : (modifiers & (0xffff ^ 1));
                            let entryModKeys = byCode ? entry.modifiers : (entry.modifiers & (0xffff ^ 1));
                            if (startsWith(keyEntry, "Shift") && byCode)
                                entryModKeys |= 1;
                            if (startsWith(keyEntry, "Control"))
                                entryModKeys |= 2;
                            if (startsWith(keyEntry, "Alt"))
                                entryModKeys |= 4;
                            if (startsWith(keyEntry, "Meta"))
                                entryModKeys |= 8;
                            if (eventModkeys !== entryModKeys)
                                return;
                            if (isExcludeTarget(entry, targetElement, tagName, type))
                                return;
                            preventDefault = true;
                            entry.action();
                        }
                    });
                    return preventDefault;
                };
                const keydownHandler = createKeydownHandler(onKeyDown);
                addKeyDownEventListener(keydownHandler);
                return {
                    register: (dotNetObj, mode, modifiers, keyEntry, exclude, excludeSelector, isDisabled) => {
                        const id = idSeq++;
                        const hotKeyEntry = new HotkeyEntry(dotNetObj, mode, modifiers, keyEntry, exclude, excludeSelector, isDisabled);
                        hotKeyEntries.set(id, hotKeyEntry);
                        return id;
                    },
                    update: (id, isDisabled) => {
                        const hotkeyEntry = hotKeyEntries.get(id);
                        if (!hotkeyEntry)
                            return;
                        hotkeyEntry.isDisabled = isDisabled;
                    },
                    unregister: (id) => {
                        if (id === -1)
                            return;
                        hotKeyEntries.delete(id);
                    },
                    dispose: () => { removeKeyDownEventListener(keydownHandler); }
                };
            };
            HotKeys2.handleKeyEvent = (hotKeysWrapper, isWasm) => {
                const onKeyDown = (modifiers, key, code, targetElement, tagName, type) => {
                    if (isWasm) {
                        return hotKeysWrapper.invokeMethod(OnKeyDownMethodName, modifiers, tagName, type, key, code);
                    }
                    else {
                        hotKeysWrapper.invokeMethodAsync(OnKeyDownMethodName, modifiers, tagName, type, key, code);
                        return false;
                    }
                };
                const keydownHandler = createKeydownHandler(onKeyDown);
                addKeyDownEventListener(keydownHandler);
                return {
                    dispose: () => { removeKeyDownEventListener(keydownHandler); }
                };
            };
        })(HotKeys2 = Blazor.HotKeys2 || (Blazor.HotKeys2 = {}));
    })(Blazor = Toolbelt.Blazor || (Toolbelt.Blazor = {}));
})(Toolbelt || (Toolbelt = {}));
