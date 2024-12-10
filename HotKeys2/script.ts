﻿export namespace Toolbelt.Blazor.HotKeys2 {

    // Constants

    const enum Exclude {
        None = 0,
        InputText = 0b0001,
        InputNonText = 0b0010,
        TextArea = 0b0100,
        ContentEditable = 0b1000
    }

    const enum ModCodes {
        None = 0,
        Shift = 0x01,
        Control = 0x02,
        Alt = 0x04,
        Meta = 0x08
    }

    const enum HotKeyMode {
        ByKey,
        ByCode
    }

    const doc = document;

    const OnKeyDownMethodName = "OnKeyDown";

    const NonTextInputTypes = ["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit",];

    const InputTagName = "INPUT";
    const FluentInputTagName = "FLUENT-TEXT-FIELD";

    const TextAreaTagName = "TEXTAREA";
    const FluentTextAreaTagName = "FLUENT-TEXT-AREA";

    const keydown = "keydown";

    class HotkeyEntry {

        constructor(
            private dotNetObj: any,
            public mode: HotKeyMode,
            public modifiers: ModCodes,
            public keyEntry: string,
            public exclude: Exclude,
            public excludeSelector: string,
            public isDisabled: boolean
        ) { }

        public action(): void {
            this.dotNetObj.invokeMethodAsync('InvokeAction');
        }
    }

    // Static Functions

    const addKeyDownEventListener = (listener: (ev: KeyboardEvent) => void) => doc.addEventListener(keydown, listener);

    const removeKeyDownEventListener = (listener: (ev: KeyboardEvent) => void) => doc.removeEventListener(keydown, listener);

    const convertToKeyName = (ev: KeyboardEvent): string => {
        const convertToKeyNameMap: { [key: string]: string } = {
            "OS": "Meta",
            "Decimal": "Period",
        };
        return convertToKeyNameMap[ev.key] || ev.key;
    }

    const startsWith = (str: string, prefix: string): boolean => str.startsWith(prefix);

    const isExcludeTarget = (entry: HotkeyEntry, targetElement: HTMLElement, tagName: string, type: string | null): boolean => {

        if ((entry.exclude & Exclude.InputText) !== 0) {
            if ((tagName === InputTagName || tagName === FluentInputTagName) && NonTextInputTypes.every(t => t !== type)) return true;
        }
        if ((entry.exclude & Exclude.InputNonText) !== 0) {
            if (tagName === InputTagName && NonTextInputTypes.some(t => t === type)) return true;
        }
        if ((entry.exclude & Exclude.TextArea) !== 0) {
            if (tagName === TextAreaTagName || tagName === FluentTextAreaTagName) return true;
        }
        if ((entry.exclude & Exclude.ContentEditable) !== 0) {
            if (targetElement.isContentEditable) return true;
        }

        if (entry.excludeSelector !== '' && targetElement.matches(entry.excludeSelector)) return true;

        return false;
    }

    type KeyEventHandler = (modifiers: ModCodes, key: string, code: string, targetElement: HTMLElement, tagName: string, type: string | null) => boolean;

    const createKeydownHandler = (callback: KeyEventHandler) => {
        return (ev: KeyboardEvent) => {
            if (typeof (ev["altKey"]) === 'undefined') return;
            const modifiers =
                (ev.shiftKey ? ModCodes.Shift : 0) +
                (ev.ctrlKey ? ModCodes.Control : 0) +
                (ev.altKey ? ModCodes.Alt : 0) +
                (ev.metaKey ? ModCodes.Meta : 0);
            const key = convertToKeyName(ev);
            const code = ev.code;

            const targetElement = ev.target as HTMLElement;
            const tagName = targetElement.tagName;
            const type = targetElement.getAttribute('type');

            const preventDefault = callback(modifiers, key, code, targetElement, tagName, type);
            if (preventDefault) ev.preventDefault();
        }
    }

    export const createContext = () => {
        let idSeq: number = 0;
        const hotKeyEntries = new Map<number, HotkeyEntry>();

        const onKeyDown = (modifiers: ModCodes, key: string, code: string, targetElement: HTMLElement, tagName: string, type: string | null): boolean => {
            let preventDefault = false;

            hotKeyEntries.forEach(entry => {

                if (!entry.isDisabled) {
                    const byCode = entry.mode === HotKeyMode.ByCode;
                    const eventKeyEntry = byCode ? code : key;
                    const keyEntry = entry.keyEntry;

                    if (keyEntry !== eventKeyEntry) return;

                    const eventModkeys = byCode ? modifiers : (modifiers & (0xffff ^ ModCodes.Shift));
                    let entryModKeys = byCode ? entry.modifiers : (entry.modifiers & (0xffff ^ ModCodes.Shift));
                    if (startsWith(keyEntry, "Shift") && byCode) entryModKeys |= ModCodes.Shift;
                    if (startsWith(keyEntry, "Control")) entryModKeys |= ModCodes.Control;
                    if (startsWith(keyEntry, "Alt")) entryModKeys |= ModCodes.Alt;
                    if (startsWith(keyEntry, "Meta")) entryModKeys |= ModCodes.Meta;
                    if (eventModkeys !== entryModKeys) return;

                    if (isExcludeTarget(entry, targetElement, tagName, type)) return;

                    preventDefault = true;
                    entry.action();
                }
            });

            return preventDefault;
        }

        const keydownHandler = createKeydownHandler(onKeyDown);

        addKeyDownEventListener(keydownHandler);

        return {
            register: (dotNetObj: any, mode: HotKeyMode, modifiers: ModCodes, keyEntry: string, exclude: Exclude, excludeSelector: string, isDisabled: boolean): number => {
                const id = idSeq++;
                const hotKeyEntry = new HotkeyEntry(dotNetObj, mode, modifiers, keyEntry, exclude, excludeSelector, isDisabled);
                hotKeyEntries.set(id, hotKeyEntry);
                return id;
            },

            update: (id: number, isDisabled: boolean): void => {
                const hotkeyEntry = hotKeyEntries.get(id);
                if (!hotkeyEntry) return;
                hotkeyEntry.isDisabled = isDisabled;
            },

            unregister: (id: number): void => {
                if (id === -1) return;
                hotKeyEntries.delete(id);
            },

            dispose: (): void => { removeKeyDownEventListener(keydownHandler); }
        };
    }

    export const handleKeyEvent = (hotKeysWrapper: any, isWasm: boolean) => {

        const onKeyDown = (modifiers: ModCodes, key: string, code: string, targetElement: HTMLElement, tagName: string, type: string | null): boolean => {
            if (isWasm) {
                return hotKeysWrapper.invokeMethod(OnKeyDownMethodName, modifiers, tagName, type, key, code);
            } else {
                hotKeysWrapper.invokeMethodAsync(OnKeyDownMethodName, modifiers, tagName, type, key, code);
                return false;
            }
        }

        const keydownHandler = createKeydownHandler(onKeyDown);

        addKeyDownEventListener(keydownHandler);

        return {
            dispose: () => { removeKeyDownEventListener(keydownHandler); }
        };
    }
}