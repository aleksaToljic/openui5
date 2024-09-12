sap.ui.define([], function () {
    "use strict";

    /**
     Initialize the Controller
     @param {sap.ui.core.mvc.Controller} control Represents the controller, must be accessed via `this` inside the `sap.ui.controller` function
     */
    function Controller(control) {
        this.controller = control;
    }

    /**
     * @param {string} type Represents type of the element we are getting (we support only 'action' at the moment)
     * @param {string} id Represents the Id that we mentioned in our manifest, for example:
     * ```javascript
     * "Actions": {
     *    "GlobalVersionBtn": {
     *        "id": "GlobalVersionBtn",
     * ```
     * The above would be used `Controller.getById('action', 'GlobalVersionBtn')`
     * @returns {sap.ui.core.Element} e.g. `sap.m.Button`
     */
    Controller.prototype.getById = function (type, id) {
        const view = this.controller.getView();
        return view.byId(view.getId() + '--' + type + '::' + id);
    };

    return Controller;
});
