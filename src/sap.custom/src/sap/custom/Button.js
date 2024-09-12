sap.ui.define([], function () {
    "use strict";

    /**
     * Initialize the button, Button control should be passed here, usually by getting the element via `this.byId('buttonId')`
     * @param {sap.m.Button} control - The Button control to be wrapped
     */
    function Button(control) {
        this.button = control;
    }

    /**
     * If some method is not supported via this component, this is the way to return the native button, but ideally we should support all Button methods here, this should be avoided
     * @returns {sap.m.Button} - The native Button control
     */
    Button.getButton = function () {
        return this.button;
    };

    /**
     * Just one of the button methods that allows you to add text to Button
     * For more info check https://sapui5.hana.ondemand.com/#/api/sap.m.Button%23methods
     *
     * @param {string} text - The text to be displayed on the button
     * @returns {sap.m.Button} button
     */
    Button.prototype.setText = function (text) {
        return this.button.setText(text);
    };

    /**
     * For more info check https://sapui5.hana.ondemand.com/#/api/sap.m.Button%23methods
     *
     * @param {boolean} isIconFirst (by default this is true, we usually use this to set it to false)
     * @returns {sap.m.Button} button
     */
    Button.prototype.setIconFirst = function (isIconFirst) {
        return this.button.setIconFirst(isIconFirst);
    };

    /**
     * For more info check https://sapui5.hana.ondemand.com/#/api/sap.m.Button%23methods
     *
     * @param {string} iconPath - The path to the icon, for example: `sap-icon://accept`
     * @returns {sap.m.Button} button
     */
    Button.prototype.setIcon = function (iconPath) {
        return this.button.setIcon(iconPath);
    };

    return Button;
});
