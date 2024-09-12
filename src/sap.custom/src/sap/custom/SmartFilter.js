sap.ui.define(["sap/custom/util/Util"], function (Util) {
    "use strict";

    /**
     Configures the filter, by getting the control via ID
     @param {sap.ui.core.mvc.Controller} control Represents the controller, usually accessed via `this`
     @param {Object<string, string>} options supported options to edit the smart filter
     @param {string} filterId Id how we can get smartFilter control
     */
    function SmartFilter(control, options, filterId = 'listReportFilter') {
        this.filter = control.getView().byId(control.getView().getId() + '--' + filterId);
        Util.prototype.setInitialOptions(this.filter, options, ['liveMode']);
    }

    /**
     * Removing the "Go" button, and automatically filter on loading page, and on changing the filter
     * @param {boolean} mode Is a boolean that is changing the liveMode
     */
    SmartFilter.prototype.setLiveMode = function (mode) {
        this.filter.setLiveMode(mode);
    };

    /**
     * If in some case we don't support some functionality, we allow returning the filter, and using the official functionalities
     * @returns {sap.ui.core.Element} smartFilter
     */
    SmartFilter.prototype.getSmartFilter = function () {
        return this.filter;
    };

    /**
     * Return some control within the smartfilter by key, usually we use it for DOMAIN_GUID (to read it's value)
     * for more info see https://sapui5.hana.ondemand.com/sdk/#/api/sap.ui.comp.smartfilterbar.SmartFilterBar%23methods/getControlByKey
     * @deprecated
     * @param {string} key Filter key (e.g. DOMAIN_GUID)
     * @returns {sap.ui.core.Control} control
     */
    SmartFilter.prototype.getControlByKey = function (key) {
        return this.filter.getControlByKey(key);
    };

    /**
     * @param {string} filterKey key that we want to return in queryParam
     * @return {string} queryParam
     */
    SmartFilter.prototype.getFilterQueryParamByKey = function (filterKey) {
        const filters = this.filter.getFilterData();
        let queryParam = '';
        Object.entries(filters).forEach(([key, value]) => {
            if (key === filterKey) {
                queryParam = `${filterKey}=${value}`;
            }
        });
        return queryParam;
    };

    return SmartFilter;
});
