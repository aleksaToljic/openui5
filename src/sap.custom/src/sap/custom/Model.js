//v1.1
sap.ui.define(["sap/custom/util/Util"], function (Util) {
    "use strict";

    /**
     * Initialize the desired model
     * @param {sap.ui.core.mvc.Controller} control Represents the controller, usually accessed via `this`
     * @param {Object<string,string>} options
     * `sizeLimit` that will use `model.setSizeLimit()` to set the limit,
     * without extending the size limit, model's can't hold large set of data
     * @constructor
     */
    function Model(control, options = {}) {
        this.model = control.getOwnerComponent().getModel(options.modelName);

        // configures the initial settings
        Util.prototype.setInitialOptions(this.model, options, ['sizeLimit']);
    }

    /**
     * @returns {sap.ui.model.Model} Model
     */
    Model.prototype.getModel = function () {
        return this.model;
    };

    /**
     * setProperty will populate the model with new property and it's value
     * (for more info see https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.model.odata.v2.ODataModel%23methods/setProperty)
     *
     * @param {string} path (Path where we'll store the value, it must start with slash "/" (e.g "/appLinks"))
     * @param {any} value (value to store in model, so that it can be accessed in XML or JS)
     * @returns {sap.ui.model.Model} Usefull for chaining more setProperty calls
     */
    Model.prototype.setProperty = function (path, value) {
        this.model.setProperty(path, value);

        return this.model;
    };

    /**
     * getServiceURL should be used when we want to get the url of BE service that will work across all environments.
     * Mostly used when we want to target our services via ajax, xmlHttpRequest or fetch.
     *
     * @param {string} service path that we want to get, it should look something like this `/CA_AR_REPORTING/api/v1/`
     * @returns {string} Returns full path to the service that looks something like this: `../{uuid}.{app_name}/~{uuid}~/{service}`
     */
    Model.prototype.getServiceURL = function (service) {
        const originalServiceModel = this.model.sServiceUrl;
        const paths = originalServiceModel.split('~');
        if (paths.length === 3) {
        const servicePrefix = [paths[0], paths[1]].join('~');
            return servicePrefix + service;
        } else {
            throw new Error('Failed to get serviceURL:' + service);
        }
    };

    return Model;
});
