sap.ui.define([], function () {
    "use strict";

    /**
     * A utility class for common functions.
     * @alias sap.custom.util.Util
     * @param {sap.ui.core.Control} control The control instance.
     * @public
     */
    function Util(control) {
        this.control = control;
    }

    /**
     * this is a function that can allow setting initial values through options
     * (e.g we want to set model.setSizeLimit() we can do that by setInitialOptions(model, {sizeLimit: '1000'}, ['sizeLimit']))
     * second param is to make strict what options we support (as we don't have Typescript), and it's optional.
     *
     * @param {sap.ui.core.Control} control Pass the control where we'll fire the setFunction
     * @param {Object<string,string>} options Any simple object with just strings or booleans
     * @param {Array<string>} supportedKeys (optional) We limit here all the option keys we support
     */
    Util.prototype.setInitialOptions = function (control, options = {}, supportedKeys = Object.keys(options)) {
        Object.entries(options).filter(([key, _]) => supportedKeys.includes(key)).forEach(([key, value]) => {
            //splits the key to first letter (string) and rest of letters in Array (e.g 'key' => 'k' and ['e', 'y'])
            const [firstLetter, ...restOfKeys] = key;
            control[`set${firstLetter.toUpperCase()}${restOfKeys.join('')}`](value);
        });
    };

    return Util;
});
