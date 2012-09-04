// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Lang = imports.lang;
const Signals = imports.signals;

const Main = imports.ui.main;
const Params = imports.misc.params;

const DEFAULT_MODE = 'restrictive';

const _modes = {
    'restrictive': {
        hasOverview: false,
        showCalendarEvents: false,
        allowSettings: false,
        allowExtensions: false,
        allowKeybindingsWhenModal: false,
        hasRunDialog: false,
        hasWorkspaces: false,
        hasWindows: false,
        isLocked: false,
        createUnlockDialog: null,
        components: [],
        panel: {
            left: [],
            center: [],
            right: []
        },
    },

    'gdm': {
        allowKeybindingsWhenModal: true,
        createUnlockDialog: Main.createGDMLoginDialog,
        panel: {
            left: [],
            center: ['dateMenu'],
            right: ['a11y', 'display', 'keyboard',
                    'volume', 'battery', 'powerMenu']
        }
    },

    'lock-screen': {
        isLocked: true,
        components: ['networkAgent', 'polkitAgent', 'telepathyClient'],
        createUnlockDialog: Main.createSessionUnlockDialog,
        panel: {
            left: ['userMenu'],
            center: [],
            right: ['lockScreen']
        },
    },

    'initial-setup': {
        components: ['keyring'],
        panel: {
            left: [],
            center: ['dateMenu'],
            right: ['a11y', 'keyboard', 'volume']
        }
    },

    'user': {
        hasOverview: true,
        showCalendarEvents: true,
        allowSettings: true,
        allowExtensions: true,
        hasRunDialog: true,
        hasWorkspaces: true,
        hasWindows: true,
        components: ['networkAgent', 'polkitAgent', 'telepathyClient',
                     'keyring', 'recorder', 'autorunManager', 'automountManager'],
        panel: {
            left: ['activities', 'appMenu'],
            center: ['dateMenu'],
            right: ['a11y', 'keyboard', 'volume', 'bluetooth',
                    'network', 'battery', 'userMenu']
        }
    }
};

function listModes() {
    let modes = Object.getOwnPropertyNames(_modes);
    for (let i = 0; i < modes.length; i++)
        print(modes[i]);
}

const SessionMode = new Lang.Class({
    Name: 'SessionMode',

    _init: function() {
        global.connect('notify::session-mode', Lang.bind(this, this._sync));
        this._modeStack = [global.session_mode];
        this._sync();
    },

    pushMode: function(mode) {
        this._modeStack.push(mode);
        this._sync();
    },

    popMode: function(mode) {
        if (this.currentMode != mode || this._modeStack.length === 1)
            throw new Error("Invalid SessionMode.popMode");
        this._modeStack.pop();
        this._sync();
    },

    get currentMode() {
        return this._modeStack[this._modeStack.length - 1];
    },

    _sync: function() {
        let params = _modes[this.currentMode];
        params = Params.parse(params, _modes[DEFAULT_MODE]);

        this._createUnlockDialog = params.createUnlockDialog;
        delete params.createUnlockDialog;

        Lang.copyProperties(params, this);
        this.emit('updated');
    },

    createUnlockDialog: function() {
        if (this._createUnlockDialog)
            return this._createUnlockDialog.apply(this, arguments);
        else
            return null;
    },
});
Signals.addSignalMethods(SessionMode.prototype);
